import { useEffect, useMemo, useRef, useState } from "react";
import {
  Gem,
  Search,
  Sun,
  Moon,
  Layers,
  LayoutGrid,
  Plus,
  Compass,
  Menu,
  X,
  Trash2,
} from "lucide-react";
import { APP_NAME } from "../constants";
import {
  getSites,
  addSite,
  updateSite,
  deleteSite,
  getCategories,
  addCategory,
  deleteCategory,
} from "../storage";
import type { SavedSite } from "../types";
import { useTheme } from "../useTheme";
import SiteCard from "./SiteCard";
import CategoryFolderCard from "./CategoryFolderCard";
import CategoryModal from "./CategoryModal";
import LaunchModal from "./LaunchModal";
import GemModal from "./GemModal";
import ConfirmModal from "./ConfirmModal";

type ViewMode = "cards" | "appgrid";

export default function Dashboard() {
  const { resolvedTheme, toggleTheme } = useTheme();

  // Core data states
  const [sites, setSites] = useState<SavedSite[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Navigation & filter states (persists view mode across refreshes)
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem("linktrove_view_mode");
      return saved === "appgrid" || saved === "cards" ? saved : "cards";
    } catch {
      return "cards";
    }
  });

  // Also hydrate from chrome.storage.local to guarantee cross-session persistence
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local
        .get("linktrove_view_mode")
        .then((res) => {
          const saved = res?.linktrove_view_mode;
          if (saved === "appgrid" || saved === "cards") {
            setCurrentView(saved);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSetView = (mode: ViewMode) => {
    setCurrentView(mode);
    try {
      localStorage.setItem("linktrove_view_mode", mode);
    } catch {
      // Ignore storage errors
    }
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({ linktrove_view_mode: mode }).catch(() => {});
    }
  };

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategoryModal, setActiveCategoryModal] = useState<string | null>(null);

  // Modal states
  const [launchedSite, setLaunchedSite] = useState<SavedSite | null>(null);
  const [gemModalOpen, setGemModalOpen] = useState(false);
  const [siteToEdit, setSiteToEdit] = useState<SavedSite | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // New category inline input in sidebar
  const [newCatInput, setNewCatInput] = useState("");
  const [isAddingCat, setIsAddingCat] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initial load
  useEffect(() => {
    getSites().then(setSites);
    getCategories().then(setCategories);
  }, []);

  // Live Sync: Listen for storage updates (e.g. bookmarks added via extension popup)
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === "local") {
        if (changes.sites) {
          setSites((changes.sites.newValue as SavedSite[] | undefined) ?? []);
        }
        if (changes.categories) {
          setCategories(
            (changes.categories.newValue as string[] | undefined) ?? [],
          );
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered sites based on category & search query
  const filteredSites = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sites.filter((site) => {
      const matchesCategory =
        activeCategory === "All" ||
        site.category.toLowerCase() === activeCategory.toLowerCase();
      const matchesSearch =
        !q ||
        site.title.toLowerCase().includes(q) ||
        site.url.toLowerCase().includes(q) ||
        (site.note && site.note.toLowerCase().includes(q)) ||
        (site.description && site.description.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [sites, activeCategory, searchQuery]);

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: sites.length };
    categories.forEach((cat) => {
      counts[cat] = sites.filter(
        (s) => s.category.toLowerCase() === cat.toLowerCase(),
      ).length;
    });
    return counts;
  }, [sites, categories]);

  // CRUD Handlers
  const handleSaveSite = async (site: SavedSite) => {
    if (siteToEdit) {
      await updateSite(site);
    } else {
      await addSite(site);
    }
    const updated = await getSites();
    setSites(updated);
  };

  const handleDeleteSite = (id: string) => {
    const site = sites.find((s) => s.id === id);
    const siteTitle = site?.title || "this site";

    setConfirmModal({
      isOpen: true,
      title: "Delete Site?",
      message: `Are you sure you want to remove "${siteTitle}"? This action cannot be undone.`,
      confirmLabel: "Delete Site",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await deleteSite(id);
        const updated = await getSites();
        setSites(updated);
        if (launchedSite?.id === id) setLaunchedSite(null);
      },
    });
  };

  const handleOpenAddModal = () => {
    setSiteToEdit(null);
    setGemModalOpen(true);
  };

  const handleOpenEditModal = (site: SavedSite) => {
    setSiteToEdit(site);
    setGemModalOpen(true);
  };

  const handleAddCategorySubmit = async () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    const updated = await addCategory(trimmed);
    setCategories(updated);
    setNewCatInput("");
    setIsAddingCat(false);
    setActiveCategory(trimmed);
  };

  const handleDeleteCategory = (catName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const count = categoryCounts[catName] ?? 0;
    const message =
      count > 0
        ? `Are you sure you want to delete category "${catName}"? The ${count} bookmark${count > 1 ? "s" : ""} inside will be moved to "Other".`
        : `Are you sure you want to delete category "${catName}"?`;

    setConfirmModal({
      isOpen: true,
      title: "Delete Category?",
      message,
      confirmLabel: "Delete Category",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (count > 0) {
          const sitesToMove = sites.filter(
            (s) => s.category.toLowerCase() === catName.toLowerCase(),
          );
          for (const s of sitesToMove) {
            await updateSite({ ...s, category: "Other" });
          }
        }
        const updated = await deleteCategory(catName);
        setCategories(updated);
        const updatedSites = await getSites();
        setSites(updatedSites);
        if (activeCategory.toLowerCase() === catName.toLowerCase()) {
          setActiveCategory("All");
        }
      },
    });
  };

  // Only display categories in sidebar that have items (or currently active)
  const visibleCategories = useMemo(() => {
    return categories.filter(
      (cat) =>
        (categoryCounts[cat] ?? 0) > 0 ||
        (activeCategory.toLowerCase() === cat.toLowerCase() && cat !== "All"),
    );
  }, [categories, categoryCounts, activeCategory]);

  // Grouped categories for App Grid View (displays all folder cards, filtered by search query if any)
  const appGridCategories = useMemo(() => {
    const matchingSites = sites.filter((site) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        site.title.toLowerCase().includes(q) ||
        site.url.toLowerCase().includes(q) ||
        (site.description && site.description.toLowerCase().includes(q)) ||
        (site.note && site.note.toLowerCase().includes(q)) ||
        site.category.toLowerCase().includes(q)
      );
    });

    const unique = Array.from(new Set(matchingSites.map((s) => s.category)));
    return unique
      .map((cat) => ({
        name: cat,
        sites: matchingSites.filter(
          (s) => s.category.toLowerCase() === cat.toLowerCase(),
        ),
      }))
      .filter((group) => group.sites.length > 0);
  }, [sites, searchQuery]);

  // Sites for the currently opened category popup modal
  const activeCategoryModalSites = useMemo(() => {
    if (!activeCategoryModal) return [];
    return sites.filter(
      (s) =>
        s.category.toLowerCase() === activeCategoryModal.toLowerCase(),
    );
  }, [sites, activeCategoryModal]);

  return (
    <div className="h-screen flex flex-col bg-page text-text-main font-sans selection:bg-accent/20 overflow-hidden">
      {/* 1. Header (Top Bar h-20) */}
      <header className="h-20 border-b border-border/40 flex items-center justify-between px-6 lg:px-10 shrink-0 bg-page/90 backdrop-blur-md z-40">
        {/* Left: Brand Logo + Name */}
        <div className="flex items-center gap-3 w-1/4">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-muted hover:text-text-main cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-10 h-10 flex items-center justify-center border border-accent/30 rounded-xl bg-accent/10 shadow-xs shrink-0">
            <Gem className="text-accent w-5 h-5" />
          </div>
          <span className="font-serif text-2xl tracking-wide text-text-main hidden sm:inline-block">
            {APP_NAME}
          </span>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl px-4">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-muted w-4 h-4 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search your archive... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border focus:border-accent/60 focus:ring-1 focus:ring-accent/20 rounded-full py-2.5 pl-11 pr-4 outline-hidden transition-all text-xs text-text-main placeholder:text-muted shadow-xs"
            />
          </div>
        </div>

        {/* Right: Theme Toggle & + New Site Button */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-muted hover:text-text-main hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4 text-accent" />
            ) : (
              <Moon className="w-4 h-4 text-accent" />
            )}
          </button>

          {/* New Site Primary Button */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-accent text-accent-text text-xs font-semibold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md shadow-accent/20 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New Site</span>
          </button>
        </div>
      </header>

      {/* 2. Workspace Body: Sidebar + Main Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar (No scroll, clean fixed layout) */}
        <aside
          className={`
            fixed md:static inset-y-20 left-0 z-30 w-72 bg-page border-r border-border/40 flex flex-col p-6 shrink-0 transition-transform duration-300 overflow-hidden
            ${mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Section: Library View Switcher */}
          <div className="mb-6 shrink-0">
            <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted mb-3">
              Library Views
            </h2>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  handleSetView("cards");
                  setActiveCategoryModal(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentView === "cards"
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-muted hover:text-text-main hover:bg-surface"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4" />
                  Card View
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSetView("appgrid");
                  setActiveCategoryModal(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentView === "appgrid"
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-muted hover:text-text-main hover:bg-surface"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <LayoutGrid className="w-4 h-4" />
                  App Grid View
                </span>
                <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-sm uppercase font-mono font-bold">
                  New
                </span>
              </button>
            </nav>
          </div>

          {/* Section: Categories */}
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted mb-3 shrink-0">
              Categories
            </h2>
            <nav className="space-y-0.5">
              {/* All Sites */}
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All");
                  setActiveCategoryModal(null);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeCategory === "All"
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-muted hover:text-text-main hover:bg-surface"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5" />
                  All Sites
                </span>
                <span className="text-[10px] font-mono opacity-60">
                  {categoryCounts["All"] ?? 0}
                </span>
              </button>

              {/* Individual Category Buttons (Only show when they have items) */}
              {visibleCategories.map((cat) => {
                const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <div key={cat} className="group relative flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        if (currentView === "appgrid") {
                          setActiveCategoryModal(cat);
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-accent/10 text-accent border border-accent/20"
                          : "text-muted hover:text-text-main hover:bg-surface"
                      }`}
                    >
                      <span className="truncate pr-5">{cat}</span>
                      <span className="text-[10px] font-mono opacity-60 shrink-0 group-hover:opacity-0 transition-opacity">
                        {categoryCounts[cat] ?? 0}
                      </span>
                    </button>

                    {/* Delete Category action on hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCategory(cat, e)}
                      title={`Delete "${cat}" category`}
                      className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-rose-400 hover:bg-surface rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {visibleCategories.length === 0 && (
                <p className="text-[11px] text-muted/50 italic px-2 py-1">
                  No categorized sites yet
                </p>
              )}
            </nav>

            {/* Inline Add Category */}
            <div className="pt-4 mt-auto shrink-0">
              {isAddingCat ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Category name"
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCategorySubmit();
                      if (e.key === "Escape") setIsAddingCat(false);
                    }}
                    className="flex-1 px-2.5 py-1 text-xs bg-surface border border-border rounded-lg outline-hidden text-text-main"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategorySubmit}
                    className="px-2 py-1 bg-accent text-accent-text text-xs rounded-lg font-medium cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCat(false)}
                    className="text-muted hover:text-text-main p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCat(true)}
                  className="w-full py-2 border border-dashed border-border/80 rounded-xl text-muted text-xs hover:border-accent/40 hover:text-text-main transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Category</span>
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-xs md:hidden"
          />
        )}

        {/* 3. Main Workspace Area */}
        <main className="flex-1 bg-page overflow-y-auto p-6 md:p-10 lg:p-12">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Top Title Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-6">
              <div className="space-y-1">
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-text-main tracking-tight">
                  {currentView === "cards" ? "Curated Collection" : "App Grid Launcher"}
                </h1>
                <p className="text-muted text-xs font-light uppercase tracking-widest pl-0.5">
                  {currentView === "cards"
                    ? "Refined selection of your saved sites"
                    : "Categorized quick-launch application cards"}
                </p>
              </div>

              {/* View Switcher (Marked area) & Site Counter */}
              <div className="flex items-center gap-4 shrink-0">
                {/* Modern Segmented View Switcher */}
                <div
                  role="tablist"
                  aria-label="View switch"
                  className="inline-flex items-center p-1 bg-surface/90 border border-border/80 rounded-2xl shadow-xs backdrop-blur-md"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={currentView === "cards"}
                    onClick={() => handleSetView("cards")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                      currentView === "cards"
                        ? "bg-accent text-accent-text shadow-sm font-semibold"
                        : "text-muted hover:text-text-main hover:bg-border/30"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Card View</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={currentView === "appgrid"}
                    onClick={() => handleSetView("appgrid")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                      currentView === "appgrid"
                        ? "bg-accent text-accent-text shadow-sm font-semibold"
                        : "text-muted hover:text-text-main hover:bg-border/30"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>App Grid View</span>
                  </button>
                </div>

                <div className="h-5 w-px bg-border/40 hidden sm:block" />

                <span className="text-xs font-mono text-muted uppercase tracking-wider shrink-0">
                  {currentView === "cards" ? filteredSites.length : sites.length}{" "}
                  {(currentView === "cards" ? filteredSites.length : sites.length) === 1 ? "Site" : "Sites"}
                </span>
              </div>
            </div>

            {/* Empty State */}
            {filteredSites.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                <div className="font-serif text-5xl text-muted/30">Empty Canvas</div>
                <p className="max-w-xs text-xs text-muted/60 font-light mx-auto leading-relaxed uppercase tracking-widest">
                  {searchQuery
                    ? "No bookmarks matched your search query."
                    : "Your library awaits its first discovery. Begin by saving what inspires you."}
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-5 py-2.5 bg-accent text-accent-text text-xs font-semibold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md shadow-accent/20 cursor-pointer"
                >
                  Add a Site
                </button>
              </div>
            )}

            {/* VIEW 1: Standard Card Grid View */}
            {currentView === "cards" && filteredSites.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSites.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    onLaunch={setLaunchedSite}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteSite}
                  />
                ))}
              </div>
            )}

            {/* VIEW 2: App Grid View (Square Category Cards with direct 1-click launch) */}
            {currentView === "appgrid" && filteredSites.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 justify-items-center">
                {appGridCategories.map((group) => (
                  <CategoryFolderCard
                    key={group.name}
                    categoryName={group.name}
                    sites={group.sites}
                    onClick={() => setActiveCategoryModal(group.name)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 4. Modals */}
      <CategoryModal
        isOpen={!!activeCategoryModal}
        categoryName={activeCategoryModal ?? ""}
        sites={activeCategoryModalSites}
        onClose={() => setActiveCategoryModal(null)}
        onEditSite={handleOpenEditModal}
        onDeleteSite={handleDeleteSite}
      />

      <LaunchModal
        site={launchedSite}
        onClose={() => setLaunchedSite(null)}
        onEdit={handleOpenEditModal}
      />

      <GemModal
        isOpen={gemModalOpen}
        siteToEdit={siteToEdit}
        categories={categories}
        onClose={() => {
          setGemModalOpen(false);
          setSiteToEdit(null);
        }}
        onSave={handleSaveSite}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}