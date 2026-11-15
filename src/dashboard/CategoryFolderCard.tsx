import { useState } from "react";
import type { SavedSite } from "../types";
import { getDomain } from "../utils";

type Props = {
  categoryName: string;
  sites: SavedSite[];
  onClick: () => void;
};

export default function CategoryFolderCard({
  categoryName,
  sites,
  onClick,
}: Props) {
  const hasMoreThanFour = sites.length > 4;

  // Primary 3 slots
  const primarySites = hasMoreThanFour ? sites.slice(0, 3) : sites.slice(0, 4);
  // Slot 4 mini cluster (up to 4 small icons for items 4, 5, 6, 7)
  const slotFourSmallSites = hasMoreThanFour ? sites.slice(3, 7) : [];

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group flex flex-col items-center cursor-pointer select-none outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
    >
      {/* 1. SQUARE CARD CONTAINER (Windows 11 Start Menu style) */}
      <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-[26px] bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.10] border border-black/[0.06] dark:border-white/[0.08] hover:border-accent/40 shadow-xs hover:shadow-lg backdrop-blur-md transition-all duration-200 p-4 flex items-center justify-center relative">
        {/* 2x2 Grid of Floating Brand Icons */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 w-full h-full items-center justify-items-center">
          {/* Slots 1, 2, 3 (or 1, 2, 3, 4 if <= 4 items) */}
          {primarySites.map((site) => (
            <FloatingMiniIcon key={site.id} site={site} />
          ))}

          {/* Slot 4: If more than 4 items, render 2x2 cluster of small icons */}
          {hasMoreThanFour && (
            <div
              title={`View all ${sites.length} items`}
              className="w-10 h-10 sm:w-11 sm:h-11 grid grid-cols-2 gap-1.5 items-center justify-items-center"
            >
              {slotFourSmallSites.map((site) => (
                <FloatingTinyIcon key={site.id} site={site} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. CATEGORY NAME & ITEM COUNT OUTSIDE (Underneath the card) */}
      <div className="mt-3 flex flex-col items-center max-w-[150px] text-center">
        <span className="text-xs sm:text-sm font-medium text-text-main/90 group-hover:text-accent transition-colors truncate w-full tracking-tight">
          {categoryName}
        </span>
        <span className="text-[10px] sm:text-[11px] text-muted font-mono tracking-wider mt-0.5">
          {sites.length} {sites.length === 1 ? "item" : "items"}
        </span>
      </div>
    </div>
  );
}

// Normal size icon for Slots 1, 2, 3
function FloatingMiniIcon({ site }: { site: SavedSite }) {
  const [error, setError] = useState(false);
  const domain = getDomain(site.url);

  const handleLaunch = (e: React.MouseEvent) => {
    e.stopPropagation(); // Directly opens website without opening the popup modal
    window.open(site.url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleLaunch}
      title={site.title || domain}
      className="flex items-center justify-center p-1.5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
    >
      {site.favicon && !error ? (
        <img
          src={site.favicon}
          alt={site.title}
          className="w-10 h-10 sm:w-11 sm:h-11 object-contain drop-shadow-xs transition-transform hover:scale-110 [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.5))] dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.5))]"
          onError={() => setError(true)}
        />
      ) : (
        <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent/15 text-accent font-semibold text-sm flex items-center justify-center">
          {(site.title || domain || "W").charAt(0).toUpperCase()}
        </span>
      )}
    </button>
  );
}

// Small size icon for the 2x2 mini cluster inside Slot 4
function FloatingTinyIcon({ site }: { site: SavedSite }) {
  const [error, setError] = useState(false);
  const domain = getDomain(site.url);

  const handleLaunch = (e: React.MouseEvent) => {
    e.stopPropagation(); // Directly opens website without opening the popup modal
    window.open(site.url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleLaunch}
      title={site.title || domain}
      className="w-4.5 h-4.5 sm:w-5 sm:h-5 flex items-center justify-center hover:scale-125 transition-transform active:scale-90 cursor-pointer"
    >
      {site.favicon && !error ? (
        <img
          src={site.favicon}
          alt={site.title}
          className="w-full h-full object-contain drop-shadow-2xs [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.5))] dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.5))]"
          onError={() => setError(true)}
        />
      ) : (
        <span className="w-full h-full rounded-xs bg-accent/20 text-accent font-bold text-[8px] flex items-center justify-center">
          {(site.title || domain || "W").charAt(0).toUpperCase()}
        </span>
      )}
    </button>
  );
}
