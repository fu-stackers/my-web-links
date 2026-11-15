import { useState } from "react";
import type { SavedSite } from "../types";
import { getDomain } from "../utils";

type Props = {
  site: SavedSite;
  onLaunch: (site: SavedSite) => void;
};

export default function AppTile({ site, onLaunch }: Props) {
  const [faviconError, setFaviconError] = useState(false);
  const domain = getDomain(site.url);

  return (
    <div
      onClick={() => onLaunch(site)}
      className="group flex flex-col items-center p-4 rounded-2xl glass-card hover:bg-surface/80 hover:border-accent/40 transition-all duration-200 cursor-pointer text-center"
    >
      {/* App Icon Container */}
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-border flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:border-accent/30 transition-all duration-200 shadow-xs shrink-0">
        {site.favicon && !faviconError ? (
          <img
            src={site.favicon}
            alt=""
            className="w-8 h-8 rounded-lg object-contain [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.5))] dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.5))]"
            onError={() => setFaviconError(true)}
          />
        ) : (
          <span className="text-accent font-semibold text-lg">
            {(site.title || domain || "W").charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* App Title */}
      <span className="text-xs text-text-main font-medium group-hover:text-accent transition-colors truncate w-full">
        {site.title}
      </span>

      {/* Category Subtitle */}
      <span className="text-[10px] text-muted uppercase tracking-wider mt-0.5">
        {site.category}
      </span>
    </div>
  );
}