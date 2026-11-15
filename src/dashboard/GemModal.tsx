import { useState } from "react";
import { X } from "lucide-react";
import type { SavedSite } from "../types";
import { normalizeUrl, getDomain } from "../utils";

type Props = {
  isOpen: boolean;
  siteToEdit: SavedSite | null;
  categories: string[];
  onClose: () => void;
  onSave: (site: SavedSite) => Promise<void>;
};

export default function GemModal({
  isOpen,
  siteToEdit,
  categories,
  onClose,
  onSave,
}: Props) {
  if (!isOpen) return null;

  return (
    <GemModalDialog
      key={siteToEdit ? siteToEdit.id : "new"}
      siteToEdit={siteToEdit}
      categories={categories}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function GemModalDialog({
  siteToEdit,
  categories,
  onClose,
  onSave,
}: Omit<Props, "isOpen">) {
  const [title, setTitle] = useState(siteToEdit?.title ?? "");
  const [url, setUrl] = useState(siteToEdit?.url ?? "");
  const [category, setCategory] = useState(
    siteToEdit?.category ?? categories[0] ?? "General",
  );
  const [note, setNote] = useState(siteToEdit?.note ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalized = normalizeUrl(url);
    if (!normalized) {
      return setError("Please enter a valid website URL (e.g. figma.com).");
    }

    setIsSubmitting(true);
    try {
      const site: SavedSite = {
        id: siteToEdit?.id ?? crypto.randomUUID(),
        url: normalized,
        title: title.trim() || getDomain(normalized),
        category: category || (categories[0] ?? "Other"),
        note: note.trim(),
        description: siteToEdit?.description,
        favicon: siteToEdit?.favicon,
        savedAt: siteToEdit?.savedAt ?? Date.now(),
      };

      await onSave(site);
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl flex flex-col text-text-main"
      >
        {/* Modal Header */}
        <div className="p-7 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-serif text-2xl text-text-main">
            {siteToEdit ? "Edit Site" : "Add New Site"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-text-main p-1 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Figma"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-page border border-border rounded-xl px-4 py-2.5 outline-hidden text-sm text-text-main focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-muted/60"
            />
          </div>

          {/* URL & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase">
                URL / Website *
              </label>
              <input
                type="text"
                required
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-page border border-border rounded-xl px-4 py-2.5 outline-hidden text-sm text-text-main focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-muted/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-page border border-border rounded-xl px-4 py-2.5 outline-hidden text-sm text-text-main focus:border-accent/40 transition-all cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note / Observation */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-[0.2em] text-muted uppercase">
              Description / Personal Note
            </label>
            <textarea
              rows={3}
              placeholder="Why are you bookmarking this?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-page border border-border rounded-xl px-4 py-2.5 outline-hidden text-sm text-text-main focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-muted/60 resize-none"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted hover:text-text-main transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-accent text-accent-text text-xs font-semibold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-md shadow-accent/20 cursor-pointer"
            >
              {siteToEdit ? "Save Changes" : "Save Site"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
