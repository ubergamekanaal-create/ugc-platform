import Link from "next/link";
import { BrandCampaignComposer } from "@/components/dashboard/brand-campaign-composer";
import { BrandWorkspace } from "@/components/dashboard/brand-workspace";
import { WorkspacePanel } from "@/components/dashboard/workspace-shell";
import type {
  BrandCampaignSummary,
  BrandDashboardData,
  UserProfile,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

type BrandCampaignEditorScreenProps = {
  profile: UserProfile & { role: "brand" };
  data: BrandDashboardData;
  campaign?: BrandCampaignSummary | null;
};

export function BrandCampaignEditorScreen({
  profile,
  data,
  campaign = null,
}: BrandCampaignEditorScreenProps) {
  const isEditing = Boolean(campaign);

  return (
    <BrandWorkspace
      profile={profile}
      data={data}
      section="creators"
      detailView={{
        title: isEditing ? `Edit ${campaign?.title}` : "Create campaign",
        description: isEditing
          ? "Update the live brief, refine the offer, and keep creator-facing campaign details current."
          : "Set up a new campaign brief on its own page, then return to the creators workspace when the brief is ready for invites.",
        metaItems: isEditing
          ? [
              {
                label: "Status",
                value: campaign?.status.replaceAll("_", " ") ?? "Unknown",
              },
              {
                label: "Budget",
                value: formatCurrency(campaign?.budget ?? 0),
              },
              {
                label: "Deadline",
                value: campaign?.deadline
                  ? formatDate(campaign.deadline)
                  : "Flexible",
              },
            ]
          : [
              {
                label: "Mode",
                value: "New brief",
              },
              {
                label: "Campaigns",
                value: String(data.campaigns.length),
              },
              {
                label: "Open applications",
                value: String(data.applications.length),
              },
            ],
        banner: (
          <WorkspacePanel className="bg-[linear-gradient(135deg,_rgba(231,242,255,0.95),_rgba(255,255,255,0.98),_rgba(239,246,255,0.94))]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                  {isEditing ? "Campaign edit" : "Campaign create"}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {isEditing
                    ? "Adjust the campaign without editing it inline in the creators table."
                    : "Build the brief here, then return to the campaigns tab to manage it in-table."}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                  {isEditing
                    ? "Use the dedicated form for full campaign changes, then jump back into creator invites and status management from the creators workspace."
                    : "This page is designed for campaign setup. Once you save, the workspace sends you back to the campaigns tab so you can continue with creator sourcing."}
                </p>
              </div>
              <Link
                href="/dashboard/creators"
                className="inline-flex h-11 items-center justify-center rounded-full border border-accent/15 bg-[rgba(7,107,210,0.06)] px-5 text-sm font-semibold text-accent transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.1)]"
              >
                Back to creators
              </Link>
            </div>
          </WorkspacePanel>
        ),
        content: (
          <WorkspacePanel>
            <div className="max-w-5xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Campaign form
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {isEditing ? "Update campaign brief" : "Launch a new campaign brief"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {isEditing
                  ? "Edit targeting, deliverables, budget, and timeline from one place."
                  : "Add the brief details once, then return to the creators table to invite the right people."}
              </p>
              <div className="mt-8">
                <BrandCampaignComposer
                  brandId={profile.id}
                  campaign={campaign}
                  cancelHref="/dashboard/creators"
                  cancelLabel="Back to creators"
                  redirectTo="/dashboard/creators"
                />
              </div>
            </div>
          </WorkspacePanel>
        ),
      }}
    />
  );
}
