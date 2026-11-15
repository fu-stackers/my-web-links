import { useEffect, useState } from "react";
import { X, ExternalLink, Pencil, Copy, Check } from "lucide-react";
import type { SavedSite } from "../types";
import { getDomain } from "../utils";

type Props = {
  site: SavedSite | null;
  onClose: () => void;
  onEdit: (site: SavedSite) => void;
};

export default function LaunchModal({ site, onClose, onEdit }: Props) {
  const [copied, setCopied] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!site) return null;

  const domain = getDomain(site.url);
  const dateFormatted = new Date(site.savedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(site.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border dark:border-accent/25 w-full max-w-lg rounded-[2rem] p-7 shadow-2xl relative flex flex-col gap-5 text-text-main"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-6 right-6 text-muted hover:text-text-main p-1 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Favicon + Title + Domain */}
        <div className="flex items-center gap-4 pr-8">
          <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl flex items-center justify-center border border-border shrink-0">
            {site.favicon && !faviconError ? (
              <img
                src={site.favicon}
                alt=""
                className="w-8 h-8 rounded-lg object-contain [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.5))] dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.5))]"
                onError={() => setFaviconError(true)}
              />
            ) : (
              <span className="text-accent font-semibold text-xl">
                {(site.title || domain || "W").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-2xl text-text-main tracking-wide truncate">
              {site.title}
            </h2>
            <p className="text-xs text-accent font-mono truncate mt-0.5">
              {domain}
            </p>
          </div>
        </div>

        {/* Curator Note / Description */}
        <div className="bg-page dark:bg-white/[0.03] p-4 rounded-xl border border-border text-sm text-text-main/90 font-light italic leading-relaxed">
          {site.note ||
            site.description ||
            "No personal observation recorded for this bookmark."}
        </div>

        {/* Footer: Date & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-widest uppercase text-accent px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 font-medium">
              {site.category}
            </span>
            <span className="text-xs text-muted font-mono">
              {dateFormatted}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Copy Link */}
            <button
              type="button"
              onClick={handleCopy}
              title="Copy URL"
              className="px-3 py-2 rounded-xl bg-surface border border-border text-muted hover:text-text-main text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Edit Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(site);
              }}
              className="px-3.5 py-2 rounded-xl bg-surface border border-border text-text-main hover:border-accent/40 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            {/* Launch Web Button */}
            <a
              href={site.url}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2 rounded-xl bg-accent text-accent-text hover:opacity-90 active:scale-95 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-accent/20 transition-all cursor-pointer"
            >
              <span>Launch Web</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
