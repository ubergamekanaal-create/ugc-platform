"use client";
/* eslint-disable @next/next/no-img-element */

import type { SubmissionAsset } from "@/lib/types";
import { cn, formatFileSize } from "@/lib/utils";

type SubmissionAssetsGalleryProps = {
  assets: SubmissionAsset[];
  className?: string;
  emptyLabel?: string;
};

function groupAssetsByRevision(assets: SubmissionAsset[]) {
  return assets.reduce((groups, asset) => {
    const existing = groups.get(asset.revision_number) ?? [];
    existing.push(asset);
    groups.set(asset.revision_number, existing);
    return groups;
  }, new Map<number, SubmissionAsset[]>());
}

export function SubmissionAssetsGallery({
  assets,
  className,
  emptyLabel = "No uploaded assets yet.",
}: SubmissionAssetsGalleryProps) {
  if (!assets.length) {
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

  const revisions = [...groupAssetsByRevision(assets).entries()].sort(
    (left, right) => right[0] - left[0],
  );

  return (
    <div className={cn("space-y-4", className)}>
      {revisions.map(([revisionNumber, revisionAssets]) => (
        <div
          key={revisionNumber}
          className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950">
              Revision {revisionNumber}
            </p>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
              {revisionAssets.length} file{revisionAssets.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {revisionAssets.map((asset) => (
              <div
                key={asset.id}
                className="group overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-[0_18px_35px_rgba(15,23,42,0.08)]"
              >
                {asset.kind === "image" && asset.signed_url ? (
                  <img
                    src={asset.signed_url}
                    alt={asset.file_name}
                    className="h-48 w-full object-cover"
                  />
                ) : asset.kind === "video" && asset.signed_url ? (
                  <video
                    controls
                    preload="metadata"
                    className="h-48 w-full bg-slate-950 object-cover"
                  >
                    <source src={asset.signed_url} type={asset.mime_type ?? undefined} />
                  </video>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(7,107,210,0.12),_transparent_58%),linear-gradient(180deg,_#f8fafc,_#e2e8f0)]">
                    <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      {asset.signed_url ? "File download" : "Preview unavailable"}
                    </div>
                  </div>
                )}

                <div className="space-y-2 px-4 py-4">
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
                      Open asset
                    </a>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Signed URL unavailable for this file.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
