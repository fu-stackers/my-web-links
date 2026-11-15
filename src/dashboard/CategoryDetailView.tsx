import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, ExternalLink, Pencil, Trash2 } from "lucide-react";
import type { SavedSite } from "../types";
import { getDomain } from "../utils";

type Props = {
  categoryName: string;
  sites: SavedSite[];
  onBack: () => void;
  onEditSite: (site: SavedSite) => void;
  onDeleteSite: (id: string) => void;
};

export default function CategoryDetailView({
  categoryName,
  sites,
  onBack,
  onEditSite,
  onDeleteSite,
}: Props) {
  const [query, setQuery] = useState("");

  // Keyboard shortcut: Escape to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  const filteredSites = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        getDomain(s.url).toLowerCase().includes(q),
    );
  }, [sites, query]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Category Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-border/60 hover:text-accent text-xs font-medium flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Return to all categories (Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Grid</span>
          </button>

          <div className="h-4 w-px bg-border/60" />

          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-serif font-bold text-text-main tracking-tight">
              {categoryName}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
              {sites.length} {sites.length === 1 ? "app" : "apps"}
            </span>
          </div>
        </div>

        {/* Search within this folder */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${categoryName}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface border border-border focus:border-accent/60 rounded-xl py-1.5 pl-9 pr-3 text-xs text-text-main placeholder:text-muted outline-hidden transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Empty State in Search */}
      {filteredSites.length === 0 && (
        <div className="py-16 text-center text-muted space-y-2">
          <p className="text-xs">No bookmarks found in "{categoryName}".</p>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs text-accent hover:underline cursor-pointer"
            >
              Clear search filter
            </button>
          )}
        </div>
      )}

      {/* Desktop App Icons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
        {filteredSites.map((site) => (
          <AppLauncherTile
            key={site.id}
            site={site}
            onEdit={() => onEditSite(site)}
            onDelete={() => onDeleteSite(site.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AppLauncherTile({
  site,
  onEdit,
  onDelete,
}: {
  site: SavedSite;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [faviconError, setFaviconError] = useState(false);
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
      className="group relative flex flex-col items-center p-3.5 rounded-2xl hover:bg-surface/90 hover:border-accent/40 border border-transparent transition-all duration-200 cursor-pointer text-center outline-hidden focus-visible:ring-2 focus-visible:ring-accent select-none"
    >
      {/* Quick Action Badges (Edit / Delete) on Hover */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 rounded-lg bg-surface/90 border border-border hover:text-accent hover:border-accent/40 text-muted transition-colors cursor-pointer shadow-xs"
          title="Edit bookmark"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded-lg bg-surface/90 border border-border hover:text-rose-500 hover:border-rose-500/40 text-muted transition-colors cursor-pointer shadow-xs"
          title="Delete bookmark"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Large App Icon Container */}
      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-zinc-100 dark:bg-zinc-800/90 border border-border group-hover:border-accent/40 flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:shadow-md transition-all duration-200 shadow-xs shrink-0 relative">
        {site.favicon && !faviconError ? (
          <img
            src={site.favicon}
            alt=""
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-contain [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.5))] dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.5))]"
            onError={() => setFaviconError(true)}
          />
        ) : (
          <span className="text-accent font-serif font-bold text-xl sm:text-2xl">
            {(site.title || domain || "W").charAt(0).toUpperCase()}
          </span>
        )}

        {/* External Link tiny cue badge */}
        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-80 transition-opacity text-accent">
          <ExternalLink className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* App Title */}
      <span className="text-xs text-text-main font-medium group-hover:text-accent transition-colors truncate w-full tracking-tight">
        {site.title}
      </span>

      {/* Domain */}
      <span className="text-[10px] text-muted truncate w-full mt-0.5">
        {domain}
      </span>
    </div>
  );
}
