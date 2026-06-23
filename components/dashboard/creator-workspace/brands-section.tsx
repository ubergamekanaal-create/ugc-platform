"use client";

import Link from "next/link";
import { useState } from "react";
import { HoverLift } from "@/components/shared/motion";
import { cn } from "@/lib/utils";
import { SectionPanel } from "./section-panel";
import type { BrandConnection, CreatorWorkspaceSectionContext } from "./types";

type BrandViewMode = "list" | "grid";

const metricLabels = [
  { key: "openCampaigns", label: "Briefs" },
  { key: "offers", label: "Offers" },
  { key: "applied", label: "Applied" },
  { key: "accepted", label: "Active" },
] as const;

function BrandAvatar({ name }: { name: string }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold uppercase text-accent">
      {name.charAt(0)}
    </span>
  );
}

function PlatformChips({ platforms }: { platforms: string[] }) {
  if (!platforms.length) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        Direct outreach
      </span>
    );
  }

  return platforms.slice(0, 2).map((platform) => (
    <span
      key={platform}
      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
    >
      {platform}
    </span>
  ));
}

function BrandsViewToggle({
  value,
  onChange,
}: {
  value: BrandViewMode;
  onChange: (value: BrandViewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
      {(["list", "grid"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            "h-9 rounded-xl px-4 text-sm font-semibold capitalize transition",
            value === mode
              ? "bg-white text-accent shadow-[0_8px_20px_rgba(7,107,210,0.12)]"
              : "text-slate-500 hover:text-accent",
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

function BrandActions() {
  return (
    <div className="flex gap-2">
      <Link
        href="/dashboard/chat"
        className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        Chat
      </Link>
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-4 text-sm font-semibold text-white transition hover:shadow-glow"
      >
        View briefs
      </Link>
    </div>
  );
}

function BrandListView({ brands }: { brands: BrandConnection[] }) {
  return (
    <SectionPanel className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            <tr>
              <th className="px-5 py-4">Brand</th>
              <th className="px-5 py-4">Briefs</th>
              <th className="px-5 py-4">Offers</th>
              <th className="px-5 py-4">Applied</th>
              <th className="px-5 py-4">Active</th>
              <th className="px-5 py-4">Latest brief</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {brands.map((brand) => (
              <tr key={brand.name} className="transition hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <BrandAvatar name={brand.name} />
                    <div>
                      <p className="font-semibold text-slate-950">
                        {brand.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {brand.headline ?? "Brand partnership"}
                      </p>
                    </div>
                  </div>
                </td>
                {metricLabels.map((metric) => (
                  <td
                    key={metric.key}
                    className="px-5 py-4 text-sm font-semibold text-slate-700"
                  >
                    {brand[metric.key] || "-"}
                  </td>
                ))}
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-950">
                    {brand.latestCampaign}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <PlatformChips platforms={brand.platforms} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <BrandActions />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionPanel>
  );
}

function BrandGridView({ brands }: { brands: BrandConnection[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {brands.map((brand) => (
        <HoverLift key={brand.name} className="h-full">
          <SectionPanel className="h-full">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <BrandAvatar name={brand.name} />
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {brand.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {brand.headline ?? "Brand partnership"}
                  </p>
                </div>
              </div>
              {brand.accepted > 0 ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {brand.accepted} active
                </span>
              ) : null}
            </div>

            <div className="mt-6 grid grid-cols-4 gap-3 border-y border-slate-200 py-4">
              {metricLabels.map((metric) => (
                <div key={metric.key}>
                  <p className="text-lg font-semibold text-slate-950">
                    {brand[metric.key]}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-950">
                Latest: {brand.latestCampaign}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <PlatformChips platforms={brand.platforms} />
              </div>
            </div>

            <div className="mt-5">
              <BrandActions />
            </div>
          </SectionPanel>
        </HoverLift>
      ))}
    </div>
  );
}

export function CreatorWorkspaceBrandsSection({
  ctx,
}: {
  ctx: CreatorWorkspaceSectionContext;
}) {
  const { brandConnections } = ctx;
  const [viewMode, setViewMode] = useState<BrandViewMode>("list");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Brand partners
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Switch between compact rows and two-column cards.
          </p>
        </div>
        <BrandsViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "list" ? (
        <BrandListView brands={brandConnections} />
      ) : (
        <BrandGridView brands={brandConnections} />
      )}
    </div>
  );
}
