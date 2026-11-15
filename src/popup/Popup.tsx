import { useEffect, useRef, useState } from "react";
import {
  Gem,
  Sun,
  Moon,
  Check,
  Plus,
  X,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { APP_NAME } from "../constants";
import {
  addCategory,
  addSite,
  deleteCategory,
  getCategories,
  getSites,
  updateSite,
} from "../storage";
import type { SavedSite } from "../types";
import { useTheme } from "../useTheme";
import {
  checkDomain,
  getDomain,
  isSavableUrl,
  normalizeUrl,
  readDescription,
} from "../utils";

type Status = "idle" | "checking" | "unreachable" | "saved";

export default function Popup() {
  // Theme hook: reads/writes to storage and updates <html> class
  const { resolvedTheme, toggleTheme } = useTheme();

  // Core state from original logic
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);
  const [useCurrent, setUseCurrent] = useState(true);
  const [urlInput, setUrlInput] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [existing, setExisting] = useState<SavedSite | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  // Local UI additions: saving state, favicon error fallback, and category add toggle
  const [isSaving, setIsSaving] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [showCategoryPrompt, setShowCategoryPrompt] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Input refs for auto-focusing the first useful field
  const titleInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);

  const canUseCurrent = !!tab && isSavableUrl(tab.url);
  const targetUrl = normalizeUrl(useCurrent ? (tab?.url ?? "") : urlInput);

  // Auto-focus the relevant input whenever mode changes or popup mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (useCurrent) {
        titleInputRef.current?.focus();
      } else {
        linkInputRef.current?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [useCurrent]);

  // Initial load of categories and current tab info
  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
    });

    chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => {
      setTab(t);
      if (t && isSavableUrl(t.url)) {
        setTitle(t.title ?? "");
        if (t.id) readDescription(t.id).then(setDescription);
      } else {
        setUseCurrent(false);
      }
    });
  }, []);

  // Check if target URL has already been saved
  useEffect(() => {
    let ignore = false;
    getSites().then((sites) => {
      if (ignore) return;
      const found = targetUrl
        ? (sites.find((s) => normalizeUrl(s.url) === targetUrl) ?? null)
        : null;
      setExisting(found);
      if (found) {
        setCategory(found.category);
        setNote(found.note ?? "");
        if (found.title) setTitle(found.title);
      }
    });
    return () => {
      ignore = true;
    };
  }, [targetUrl]);

  // Toggle switch between "current tab" and "manual entry"
  function toggleMode() {
    if (!canUseCurrent) return;
    const next = !useCurrent;
    setUseCurrent(next);
    setTitle(next ? (tab?.title ?? "") : "");
    setError("");
    setStatus("idle");
    setFaviconError(false);
  }

  // Handle adding a new category
  async function handleAddCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const updated = await addCategory(name);
    setCategories(updated);
    setCategory(
      updated.find((c) => c.toLowerCase() === name.toLowerCase()) ?? name,
    );
    setNewCategory("");
    setIsAddingCategory(false);
  }

  // Handle deleting an unwanted category
  async function handleConfirmDeleteCategory(catName: string) {
    if (category.toLowerCase() === catName.toLowerCase()) {
      setCategory("");
    }
    const allSites = await getSites();
    const sitesInCat = allSites.filter(
      (s) => s.category.toLowerCase() === catName.toLowerCase(),
    );
    if (sitesInCat.length > 0) {
      for (const s of sitesInCat) {
        await updateSite({ ...s, category: "Other" });
      }
    }
    const updated = await deleteCategory(catName);
    setCategories(updated);
    setCategoryToDelete(null);
  }

  // Handle saving or updating bookmark
  async function handleSave(skipCheck = false) {
    if (isSaving || status === "checking") return;

    setError("");
    if (!useCurrent && !urlInput.trim()) {
      return setError("Enter a link.");
    }
    if (!targetUrl) {
      return setError(
        useCurrent
          ? "This page can't be saved."
          : "That link looks invalid. Check it and try again.",
      );
    }
    if (!category) {
      setShowCategoryPrompt(true);
      return;
    }

    if (!useCurrent && !skipCheck) {
      setStatus("checking");
      const reachable = await checkDomain(targetUrl);
      if (!reachable) {
        setStatus("unreachable");
        return;
      }
    }

    setIsSaving(true);
    try {
      const site: SavedSite = {
        id: existing?.id ?? crypto.randomUUID(),
        url: targetUrl,
        title: title.trim() || getDomain(targetUrl),
        description: useCurrent ? description : existing?.description,
        category,
        favicon: useCurrent ? tab?.favIconUrl : existing?.favicon,
        note: note.trim(),
        savedAt: existing?.savedAt ?? Date.now(),
      };

      if (existing) {
        await updateSite(site);
      } else {
        await addSite(site);
      }
      setStatus("saved");
    } finally {
      setIsSaving(false);
    }
  }

  // Handle pressing Enter in text inputs to save (not in textarea)
  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  }

  // Open the extension dashboard or switch to it if already open
  const openDashboard = async () => {
    const dashboardUrl = chrome.runtime.getURL("dashboard.html");
    try {
      const tabs = await chrome.tabs.query({});
      const existingTab = tabs.find(
        (t) => t.url && (t.url === dashboardUrl || t.url.startsWith(dashboardUrl)),
      );

      if (existingTab && existingTab.id !== undefined) {
        await chrome.tabs.update(existingTab.id, { active: true });
        if (existingTab.windowId !== undefined) {
          await chrome.windows.update(existingTab.windowId, { focused: true });
        }
        window.close();
        return;
      }
    } catch {
      // Fallback to creating a new tab if query fails
    }

    await chrome.tabs.create({ url: dashboardUrl });
    window.close();
  };

  return (
    <div className="w-110 bg-page text-text-main font-sans p-4 flex flex-col gap-2.5 antialiased selection:bg-accent/20 rounded-8xl">
      {/* 1. Header: Gem icon + Extension Name + Actions (Dashboard & Theme switch) */}
      <header className="flex items-center justify-between pb-2.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center shadow-xs">
            <Gem className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-main tracking-tight leading-tight">
              {APP_NAME}
            </h1>
            <p className="text-[11px] text-muted">Save and organize the web</p>
          </div>
        </div>

        {/* Header Actions: Quick link to dashboard + Theme toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openDashboard}
            title="Open Dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted hover:text-text-main bg-surface hover:bg-border/60 border border-border rounded-lg transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
          >
            <span>Dashboard</span>
            <ExternalLink className="w-3 h-3 text-muted" />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              resolvedTheme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            className="p-1.5 rounded-lg text-muted hover:text-text-main hover:bg-surface border border-transparent hover:border-border transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-accent" />
            ) : (
              <Moon className="w-4 h-4 text-accent" />
            )}
          </button>
        </div>
      </header>

      {/* 2. "Use current page" row with styled switch */}
      <section className="flex items-center justify-between gap-3 px-3 py-2 bg-surface border border-border rounded-xl">
        <div>
          <span className="text-xs font-semibold text-text-main block">
            Use current page
          </span>
          {!canUseCurrent && tab ? (
            <p className="text-[10px] text-muted">This page can't be saved.</p>
          ) : (
            <p className="text-[10px] text-muted">
              {useCurrent
                ? "Saving from active browser tab"
                : "Enter link manually"}
            </p>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={useCurrent}
          aria-label="Use current page"
          disabled={!canUseCurrent}
          onClick={toggleMode}
          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
            useCurrent ? "bg-accent" : "bg-border"
          } ${!canUseCurrent ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface shadow-xs transition-transform duration-150 ease-in-out ${
              useCurrent ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </section>

      {/* 3. Page card (switch ON) or Manual inputs (switch OFF) */}
      {useCurrent ? (
        <section className="bg-surface border border-border rounded-xl p-3 space-y-2">
          {/* Favicon + Domain preview */}
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
            {tab?.favIconUrl && !faviconError ? (
              <img
                src={tab.favIconUrl}
                alt=""
                className="w-6 h-6 rounded-full object-contain shrink-0 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-border [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.5))] dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.5))]"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-accent/20 text-accent font-semibold flex items-center justify-center text-xs shrink-0">
                {(title || tab?.title || "W").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold block leading-none">
                Domain
              </span>
              <p className="text-xs font-medium text-text-main truncate mt-0.5">
                {getDomain(tab?.url ?? "")}
              </p>
            </div>
          </div>

          {/* Editable Title input */}
          <div className="space-y-1">
            <label
              htmlFor="page-title-input"
              className="block text-xs font-semibold text-text-main"
            >
              Title
            </label>
            <input
              id="page-title-input"
              ref={titleInputRef}
              type="text"
              placeholder="Page title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="w-full px-3 py-1.5 text-xs bg-page border border-border rounded-xl text-text-main placeholder:text-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent transition-all duration-150"
            />
          </div>
        </section>
      ) : (
        <section className="bg-surface border border-border rounded-xl p-3 space-y-2">
          {/* Manual Link Input */}
          <div className="space-y-1">
            <label
              htmlFor="manual-link-input"
              className="block text-xs font-semibold text-text-main"
            >
              Link (required)
            </label>
            <input
              id="manual-link-input"
              ref={linkInputRef}
              type="text"
              placeholder="https://example.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="w-full px-3 py-1.5 text-xs bg-page border border-border rounded-xl text-text-main placeholder:text-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent transition-all duration-150"
            />
          </div>

          {/* Manual Title Input */}
          <div className="space-y-1">
            <label
              htmlFor="manual-title-input"
              className="block text-xs font-semibold text-text-main"
            >
              Title (optional)
            </label>
            <input
              id="manual-title-input"
              type="text"
              placeholder="e.g. Design Inspiration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleInputKeyDown}
              className="w-full px-3 py-1.5 text-xs bg-page border border-border rounded-xl text-text-main placeholder:text-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent transition-all duration-150"
            />
          </div>
        </section>
      )}

      {/* 4. Category chips */}
      <section className="space-y-1.5">
        <label className="block text-xs font-semibold text-text-main">
          Category
        </label>
        <div className="flex flex-wrap gap-1.5 items-center">
          {categories.map((c) => {
            const isSelected = c === category;
            const isProtected = c.toLowerCase() === "other" && categories.length <= 1;
            return (
              <div key={c} className="group/chip relative inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`text-xs ${
                    !isProtected ? "pl-2.5 pr-5" : "px-2.5"
                  } py-1 rounded-full transition-all duration-150 flex items-center gap-1 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent ${
                    isSelected
                      ? "bg-accent text-accent-text font-medium shadow-xs"
                      : "bg-surface hover:bg-border/60 text-muted hover:text-text-main border border-border"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                  <span>{c}</span>
                </button>

                {/* Subtle delete '×' icon on hover */}
                {!isProtected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryToDelete(c);
                    }}
                    title={`Delete "${c}" category`}
                    className={`absolute right-1 p-0.5 rounded-full transition-all cursor-pointer ${
                      isSelected
                        ? "text-accent-text/70 hover:text-accent-text hover:bg-black/10 opacity-60 hover:opacity-100"
                        : "text-muted hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover/chip:opacity-100"
                    }`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Dashed "+ New" chip or inline add form */}
          {!isAddingCategory ? (
            <button
              type="button"
              onClick={() => {
                setIsAddingCategory(true);
                setTimeout(() => newCategoryInputRef.current?.focus(), 50);
              }}
              className="border border-dashed border-border hover:border-accent text-muted hover:text-text-main rounded-full px-2.5 py-1 text-xs flex items-center gap-1 transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 w-full pt-0.5">
              <input
                ref={newCategoryInputRef}
                type="text"
                placeholder="Category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  } else if (e.key === "Escape") {
                    setIsAddingCategory(false);
                    setNewCategory("");
                  }
                }}
                className="flex-1 px-2.5 py-1 text-xs bg-surface border border-border rounded-xl text-text-main placeholder:text-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-2.5 py-1 text-xs bg-accent text-accent-text font-medium rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategory("");
                }}
                aria-label="Cancel adding category"
                className="p-1 text-muted hover:text-text-main hover:bg-surface rounded-lg border border-transparent hover:border-border transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 5. Personal Note (clean & simple) */}
      <section className="space-y-1.5">
        <label
          htmlFor="site-note-input"
          className="block text-xs font-semibold text-text-main"
        >
          Note <span className="text-[10px] font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="site-note-input"
          rows={2}
          placeholder="Add a note or thoughts..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-surface border border-border rounded-xl text-text-main placeholder:text-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent resize-none transition-all duration-150"
        />
      </section>

      {/* 6. Feedback area with aria-live */}
      <div aria-live="polite" className="space-y-1.5">
        {/* Validation error */}
        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Existing site banner */}
        {existing && (
          <div className="p-2 rounded-xl bg-accent/10 border border-accent/30 text-text-main text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-accent" />
            <span>Already saved. You can change its category or note.</span>
          </div>
        )}

        {/* Checking link state */}
        {status === "checking" && (
          <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-text-main text-xs flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            <span>Checking the link…</span>
          </div>
        )}

        {/* Unreachable site warning box */}
        {status === "unreachable" && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-text-main text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Unreachable link.</span>
            </div>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-2.5 py-1 bg-accent text-accent-text font-medium text-xs rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Save anyway
            </button>
          </div>
        )}
      </div>

      {/* 7. Big full-width Save button */}
      <button
        type="button"
        disabled={status === "checking" || isSaving}
        onClick={() => handleSave()}
        className="w-full py-2.5 px-4 bg-accent text-accent-text font-semibold text-xs rounded-xl hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all duration-150 shadow-xs flex items-center justify-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
      >
        {status === "checking" || isSaving ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{existing ? "Updating…" : "Saving…"}</span>
          </>
        ) : (
          <span>{existing ? "Update" : "Save"}</span>
        )}
      </button>

      {/* 8. After saving: integrated success banner + View all link */}
      {status === "saved" && (
        <section className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>
              Saved to{" "}
              <strong className="font-semibold text-text-main">
                {category}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={openDashboard}
            className="flex items-center gap-1 font-semibold text-accent hover:underline cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </section>
      )}

      {/* Small Category Reminder Popup Dialog */}
      {showCategoryPrompt && (
        <div
          onClick={() => setShowCategoryPrompt(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-border w-full max-w-[270px] rounded-2xl p-4 shadow-2xl space-y-3 text-center animate-in zoom-in-95 duration-150 relative"
          >
            <button
              type="button"
              onClick={() => setShowCategoryPrompt(false)}
              aria-label="Close"
              className="absolute top-2.5 right-2.5 text-muted hover:text-text-main p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="w-9 h-9 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
              <Gem className="w-4 h-4" />
            </div>

            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold text-text-main">
                Pick a Category
              </h3>
              <p className="text-[11px] text-muted leading-tight">
                Please select a category to save this site.
              </p>
            </div>

            {/* Category chips directly inside the small popup */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-1 max-h-28 overflow-y-auto">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    setShowCategoryPrompt(false);
                  }}
                  className="text-xs px-2.5 py-1 rounded-full bg-surface hover:bg-accent hover:text-accent-text text-text-main border border-border transition-all cursor-pointer font-medium"
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowCategoryPrompt(false)}
              className="w-full py-1.5 px-3 bg-accent/15 text-accent hover:bg-accent hover:text-accent-text text-xs font-medium rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Dialog */}
      {categoryToDelete && (
        <div
          onClick={() => setCategoryToDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-border w-full max-w-[270px] rounded-2xl p-4 shadow-2xl space-y-3 text-center animate-in zoom-in-95 duration-150"
          >
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <X className="w-4 h-4" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-text-main">
                Delete "{categoryToDelete}"?
              </h3>
              <p className="text-[11px] text-muted leading-relaxed">
                Any sites saved under this category will be moved to "Other".
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-1.5 px-3 border border-border text-text-main hover:bg-border/30 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteCategory(categoryToDelete)}
                className="flex-1 py-1.5 px-3 bg-rose-500 text-white hover:bg-rose-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
