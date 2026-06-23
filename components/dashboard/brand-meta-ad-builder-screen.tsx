"use client";

import Link from "next/link";
import { BrandMetaPanel } from "@/components/dashboard/brand-meta-panel";
import { BrandMetaAdWizard } from "@/components/dashboard/brand-meta-ad-wizard";
import { BrandWorkspace } from "@/components/dashboard/brand-workspace";
import { WorkspacePanel } from "@/components/dashboard/workspace-shell";
import type { BrandDashboardData, UserProfile } from "@/lib/types";

type BrandMetaAdBuilderScreenProps = {
  profile: UserProfile & { role: "brand" };
  data: BrandDashboardData;
  renderMode?: "full" | "content";
};

export function BrandMetaAdBuilderScreen({
  profile,
  data,
  renderMode = "full",
}: BrandMetaAdBuilderScreenProps) {
  const approvedSubmissions = data.submissions.filter(
    (submission) => submission.status === "approved",
  );

  return (
    <BrandWorkspace
      profile={profile}
      data={data}
      section="ads"
      renderMode={renderMode}
      detailView={{
        title: "Create ad set",
        description:
          "Build a cleaner Meta launch flow on its own page, then jump back to Ads for synced reporting and status control.",
        metaItems: [
          {
            label: "Approved content",
            value: String(approvedSubmissions.length),
          },
          {
            label: "Workspace",
            value: "Ads",
          },
          {
            label: "Mode",
            value: "Focused builder",
          },
        ],
        banner: (
          <WorkspacePanel className="bg-[linear-gradient(135deg,_rgba(231,242,255,0.95),_rgba(255,255,255,0.98),_rgba(239,246,255,0.94))]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                  Ads builder
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Launch Meta campaigns from a focused creation flow.
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  This page keeps the launch workflow separate from reporting, so your Ads section stays clean while campaign, ad set, creative, and tracking fields get more breathing room.
                </p>
              </div>
              <Link
                href="/dashboard/ads"
                className="inline-flex h-11 items-center justify-center rounded-full border border-accent/15 bg-[rgba(7,107,210,0.06)] px-5 text-sm font-semibold text-accent transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.1)]"
              >
                Back to ads
              </Link>
            </div>
          </WorkspacePanel>
        ),
        // content: (
        //   <BrandMetaPanel
        //     mode="ads"
        //     approvedSubmissions={approvedSubmissions}
        //     view="composer"
        //   />
        // ),
        content: (

          <BrandMetaAdWizard
            approvedSubmissions={
              approvedSubmissions
            }
          />

        )
      }}
    />
  );
}
