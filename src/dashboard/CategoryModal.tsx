import { useEffect, useState } from "react";
import { X, Pencil, Trash2 } from "lucide-react";
import type { SavedSite } from "../types";
import { getDomain } from "../utils";

type Props = {
  isOpen: boolean;
  categoryName: string;
  sites: SavedSite[];
  onClose: () => void;
  onEditSite: (site: SavedSite) => void;
  onDeleteSite: (id: string) => void;
};

export default function CategoryModal(props: Props) {
  if (!props.isOpen) return null;
  return <CategoryModalDialog key={props.categoryName} {...props} />;
}

function CategoryModalDialog({
  categoryName,
  sites,
  onClose,
  onEditSite,
  onDeleteSite,
}: Props) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
    >
      {/* Floating Category Card (Windows 11 Start Menu Opened Folder style) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface/95 dark:bg-[#192233]/95 backdrop-blur-3xl border border-border dark:border-white/10 w-full max-w-lg sm:max-w-xl rounded-[28px] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] relative flex flex-col gap-4 text-text-main animate-in zoom-in-95 duration-150 max-h-[85vh]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-muted hover:text-text-main p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Center Title (Windows 11 Folder Header) */}
        <div className="text-center pt-1 pb-1">
          <h2 className="text-base sm:text-lg font-semibold text-text-main tracking-tight">
            {categoryName}
          </h2>
          <p className="text-[11px] text-muted font-mono mt-0.5">
            {sites.length} {sites.length === 1 ? "site" : "sites"}
          </p>
        </div>

        {/* 4-Columns App Grid with Bare Icons and Labels Below */}
        <div className="overflow-y-auto pr-1 flex-1 min-h-[160px]">
          {sites.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 sm:gap-5 py-2">
              {sites.map((site) => (
                <AppGridItem
                  key={site.id}
                  site={site}
                  onEdit={() => {
                    onClose();
                    onEditSite(site);
                  }}
                  onDelete={() => onDeleteSite(site.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted text-xs">
              <span>No sites in this category yet.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppGridItem({
  site,
  onEdit,
  onDelete,
}: {
  site: SavedSite;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [error, setError] = useState(false);
  const domain = getDomain(site.url);

  const handleLaunch = () => {
    window.open(site.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={handleLaunch}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleLaunch();
        }
      }}
      title={`Open ${site.title} (${domain})`}
      className="group relative flex flex-col items-center p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-150 cursor-pointer text-center outline-hidden select-none active:scale-95"
    >
      {/* Quick Edit/Delete Hover Action Buttons */}
      <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 rounded-md bg-surface/90 border border-border hover:text-accent text-muted transition-colors cursor-pointer shadow-xs"
          title="Edit"
        >
          <Pencil className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded-md bg-surface/90 border border-border hover:text-rose-500 text-muted transition-colors cursor-pointer shadow-xs"
          title="Delete"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>

      {/* Bare Floating Brand Icon (Larger size) */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 mb-1.5 transition-transform group-hover:scale-110">
        {site.favicon && !error ? (
          <img
            src={site.favicon}
            alt=""
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-xs [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.5))] dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.5))]"
            onError={() => setError(true)}
          />
        ) : (
          <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-accent/15 text-accent font-semibold text-base flex items-center justify-center">
            {(site.title || domain || "W").charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* App Title underneath (matches Windows 11 style) */}
      <span className="text-xs text-text-main/90 group-hover:text-text-main font-normal tracking-tight line-clamp-2 w-full text-center leading-snug">
        {site.title}
      </span>
    </div>
  );
}
