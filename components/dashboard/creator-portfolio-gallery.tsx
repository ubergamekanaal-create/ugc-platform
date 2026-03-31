"use client";
/* eslint-disable @next/next/no-img-element */

import type { CreatorPortfolioAsset } from "@/lib/types";
import { cn, formatFileSize } from "@/lib/utils";

type CreatorPortfolioGalleryProps = {
  assets: CreatorPortfolioAsset[];
  className?: string;
  emptyLabel?: string;
  layout?: "grid" | "strip";
  onRemove?: (asset: CreatorPortfolioAsset) => void;
  removingAssetId?: string | null;
  limit?: number;
};

function renderAssetPreview(asset: CreatorPortfolioAsset, compact: boolean) {
  const heightClass = compact ? "h-40" : "h-56";

  if (asset.kind === "image" && asset.signed_url) {
    return (
      <img
        src={asset.signed_url}
        alt={asset.file_name}
        className={cn("w-full object-cover", heightClass)}
      />
    );
  }

  if (asset.kind === "video" && asset.signed_url) {
    return (
      <video
        controls={!compact}
        muted={compact}
        preload="metadata"
        className={cn("w-full bg-slate-950 object-cover", heightClass)}
      >
        <source src={asset.signed_url} type={asset.mime_type ?? undefined} />
      </video>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(7,107,210,0.12),_transparent_58%),linear-gradient(180deg,_#f8fafc,_#e2e8f0)]",
        heightClass,
      )}
    >
      <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
        {asset.signed_url ? "File sample" : "Preview unavailable"}
      </span>
    </div>
  );
}

export function CreatorPortfolioGallery({
  assets,
  className,
  emptyLabel = "No creator samples uploaded yet.",
  layout = "grid",
  onRemove,
  removingAssetId = null,
  limit,
}: CreatorPortfolioGalleryProps) {
  const visibleAssets = typeof limit === "number" ? assets.slice(0, limit) : assets;

  if (!visibleAssets.length) {
    return (
      <div
        className={cn(
          "rounded-[1.25rem] border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500",
          className,
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  const isStrip = layout === "strip";

  return (
    <div
      className={cn(
        isStrip
          ? "min-w-0 flex gap-3 overflow-x-auto pb-2"
          : "min-w-0 grid gap-4 md:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {visibleAssets.map((asset) => (
        <div
          key={asset.id}
          className={cn(
            "group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-[0_18px_35px_rgba(15,23,42,0.08)]",
            isStrip && "w-[180px] shrink-0",
          )}
        >
          <div className="relative">
            {renderAssetPreview(asset, isStrip)}
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(asset)}
                disabled={removingAssetId === asset.id}
                className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removingAssetId === asset.id ? "Removing..." : "Remove"}
              </button>
            ) : null}
          </div>

          <div className={cn("space-y-2", isStrip ? "px-3 py-3" : "px-4 py-4")}>
            <p className="truncate text-sm font-semibold text-slate-950 group-hover:text-accent">
              {asset.file_name}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{asset.mime_type ?? "File"}</span>
              <span>•</span>
              <span>{formatFileSize(asset.size_bytes)}</span>
            </div>
            {asset.signed_url ? (
              <a
                href={asset.signed_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-sm font-semibold text-accent hover:text-blue-500"
              >
                Open sample
              </a>
            ) : (
              <p className="text-sm text-slate-400">Signed URL unavailable.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
