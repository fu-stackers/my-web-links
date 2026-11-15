import { useState } from "react";
import { Pencil, Trash2, Copy, Check } from "lucide-react";
import type { SavedSite } from "../types";
import { getDomain } from "../utils";

type Props = {
  site: SavedSite;
  onLaunch: (site: SavedSite) => void;
  onEdit: (site: SavedSite) => void;
  onDelete: (id: string) => void;
};

export default function SiteCard({ site, onLaunch, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const domain = getDomain(site.url);
  const dateFormatted = new Date(site.savedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(site.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onClick={() => onLaunch(site)}
      className="glass-card rounded-2xl p-6 group relative flex flex-col justify-between h-[270px] hover:border-accent/40 hover:bg-surface/80 transition-all duration-300 cursor-pointer shadow-xs"
    >
      {/* Top Section: Favicon + Title + Domain */}
      <div>
        <div className="flex items-center gap-3.5 mb-4">
          {/* Favicon or fallback letter */}
          {site.favicon && !faviconError ? (
            <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-border flex items-center justify-center p-1.5 shrink-0">
              <img
                src={site.favicon}
                alt=""
                className="w-7 h-7 object-contain [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.5))] dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.5))]"
                onError={() => setFaviconError(true)}
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-accent/15 border border-accent/25 text-accent font-semibold flex items-center justify-center text-base shrink-0">
              {(site.title || domain || "W").charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1 pr-14">
            <h3 className="text-base font-medium text-text-main group-hover:text-accent transition-colors truncate">
              {site.title}
            </h3>
            <p className="text-xs text-muted font-mono truncate mt-0.5">
              {domain}
            </p>
          </div>
        </div>

        {/* 2-line curator note / description */}
        <p className="text-muted text-xs leading-relaxed line-clamp-2 italic font-light">
          {site.note || site.description || "No personal observation recorded."}
        </p>
      </div>

      {/* Bottom Section: Category pill + Date */}
      <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-auto">
        <span className="text-[10px] tracking-widest uppercase text-accent px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 font-medium">
          {site.category}
        </span>
        <span className="text-[10px] text-muted font-mono uppercase">
          {dateFormatted}
        </span>
      </div>

      {/* Floating Hover Actions (Top-Right) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-5 right-5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        {/* Copy Link button */}
        <button
          type="button"
          onClick={handleCopy}
          title="Copy URL"
          className="w-7 h-7 rounded-lg border border-border bg-surface text-muted hover:text-text-main hover:border-accent/40 flex items-center justify-center transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Edit button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(site);
          }}
          title="Edit"
          className="w-7 h-7 rounded-lg border border-border bg-surface text-muted hover:text-text-main hover:border-accent/40 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        {/* Delete button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(site.id);
          }}
          title="Delete"
          className="w-7 h-7 rounded-lg border border-border bg-surface text-muted hover:text-rose-400 hover:border-rose-400/30 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
