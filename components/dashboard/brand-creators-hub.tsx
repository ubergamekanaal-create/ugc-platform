"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BrandCreatorDirectory } from "@/components/dashboard/brand-creator-directory";
import { createClient } from "@/lib/supabase/client";
import type {
  BrandCampaignSummary,
  BrandCreatorDirectoryEntry,
  CampaignStatus,
} from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type BrandCreatorsHubProps = {
  brandId: string;
  campaigns: BrandCampaignSummary[];
  creators: BrandCreatorDirectoryEntry[];
};

function getCampaignStatusClasses(status: CampaignStatus) {
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "in_review") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-[rgba(7,107,210,0.1)] text-accent";
}

function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function BrandCreatorsHub({
  brandId,
  campaigns,
  creators,
}: BrandCreatorsHubProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"campaigns" | "invite_creators">(
    "campaigns",
  );
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus | "all">(
    "all",
  );
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null);
  const [campaignFeedback, setCampaignFeedback] = useState<string | null>(null);
  const [preferredCampaignId, setPreferredCampaignId] = useState<string | null>(
    null,
  );
  const [, startRefresh] = useTransition();

  const filteredCampaigns = useMemo(() => {
    const search = campaignSearch.trim().toLowerCase();

    return campaigns
      .filter((campaign) => {
        const matchesStatus =
          campaignStatus === "all" || campaign.status === campaignStatus;
        const matchesSearch =
          !search ||
          [
            campaign.title,
            campaign.product_name,
            campaign.content_type,
            campaign.description,
            campaign.creator_requirements,
            campaign.platforms.join(" "),
          ]
            .join(" ")
            .toLowerCase()
            .includes(search);

        return matchesStatus && matchesSearch;
      })
      .sort((left, right) => {
        const rightDate = Date.parse(right.created_at);
        const leftDate = Date.parse(left.created_at);

        if (!Number.isNaN(rightDate) && !Number.isNaN(leftDate)) {
          return rightDate - leftDate;
        }

        return right.title.localeCompare(left.title);
      });
  }, [campaignSearch, campaignStatus, campaigns]);

  const liveCampaignCount = campaigns.filter(
    (campaign) => campaign.status === "open" || campaign.status === "active",
  ).length;
  const inviteReadyCount = campaigns.filter(
    (campaign) => campaign.status !== "completed",
  ).length;

  async function handleCampaignStatus(
    campaignId: string,
    status: CampaignStatus,
  ) {
    setPendingCampaignId(campaignId);
    setCampaignFeedback(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("campaigns")
      .update({ status })
      .eq("id", campaignId)
      .eq("brand_id", brandId);

    if (error) {
      setCampaignFeedback(error.message);
      setPendingCampaignId(null);
      return;
    }

    setCampaignFeedback(`Campaign moved to ${formatStatusLabel(status)}.`);
    setPendingCampaignId(null);
    startRefresh(() => {
      router.refresh();
    });
  }

  function handleOpenInviteTab(campaignId: string) {
    setPreferredCampaignId(campaignId);
    setActiveTab("invite_creators");
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap gap-3">
        {[
          {
            key: "campaigns" as const,
            label: "Campaigns",
            value: `${campaigns.length} items`,
          },
          {
            key: "invite_creators" as const,
            label: "Invite creators",
            value: `${creators.length} creators`,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-semibold transition",
              activeTab === tab.key
                ? "border-transparent bg-[color:#076BD2] text-white shadow-[0_16px_34px_rgba(7,107,210,0.18)]"
                : "border-slate-200 bg-white text-slate-600 hover:border-accent/20 hover:bg-[rgba(7,107,210,0.05)] hover:text-accent",
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs",
                activeTab === tab.key
                  ? "bg-white/10 text-white"
                  : "bg-slate-100 text-slate-500",
              )}
            >
              {tab.value}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "campaigns" ? (
        <div className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                Campaigns
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Manage every brand brief from one table, then move into dedicated
                create and edit pages when the campaign needs full setup work.
              </p>
            </div>
            <Link
              href="/dashboard/creators/campaigns/new"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[color:#076BD2] px-5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.2)] transition hover:bg-[#0559AE]"
            >
              Create campaign
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-[rgba(7,107,210,0.1)] px-3 py-1 font-medium text-accent">
              {campaigns.length} total
            </span>
            <span className="rounded-full bg-[rgba(7,107,210,0.08)] px-3 py-1 font-medium text-accent">
              {liveCampaignCount} live
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              {inviteReadyCount} ready for invites
            </span>
          </div>

          {campaignFeedback ? (
            <p className="mt-4 text-sm text-slate-500">{campaignFeedback}</p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <input
              type="search"
              value={campaignSearch}
              onChange={(event) => setCampaignSearch(event.target.value)}
              placeholder="Search title, product, content type, or brief"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)] xl:max-w-md"
            />
            <select
              value={campaignStatus}
              onChange={(event) =>
                setCampaignStatus(event.target.value as CampaignStatus | "all")
              }
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_review">In review</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="mt-6 overflow-x-auto">
            {filteredCampaigns.length ? (
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">
                      Campaign
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">
                      Product
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">
                      Platforms
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">
                      Budget
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">
                      Deadline
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="align-top text-slate-700">
                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="max-w-[16rem]">
                          <p className="font-semibold text-slate-950">
                            {campaign.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {campaign.content_type}
                          </p>
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="max-w-[15rem]">
                          <p className="font-medium text-slate-950">
                            {campaign.product_name || "Not set"}
                          </p>
                          {campaign.product_details ? (
                            <p className="mt-1 max-w-[15rem] text-sm text-slate-500">
                              {campaign.product_details}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-slate-500">
                        <div className="max-w-[12rem]">
                          {campaign.platforms.length
                            ? campaign.platforms.join(", ")
                            : "Not set"}
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 font-medium text-slate-950">
                        {formatCurrency(campaign.budget)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-slate-500">
                        {campaign.deadline ? formatDate(campaign.deadline) : "Flexible"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
                            getCampaignStatusClasses(campaign.status),
                          )}
                        >
                          {formatStatusLabel(campaign.status)}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="flex min-w-[220px] flex-col gap-2">
                          <Link
                            href={`/dashboard/creators/campaigns/${campaign.id}/edit`}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-accent/15 bg-[rgba(7,107,210,0.06)] px-3 text-xs font-semibold text-accent transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.1)]"
                          >
                            Edit brief
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenInviteTab(campaign.id)}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            Invite creators
                          </button>
                          <select
                            value={campaign.status}
                            onChange={(event) =>
                              void handleCampaignStatus(
                                campaign.id,
                                event.target.value as CampaignStatus,
                              )
                            }
                            disabled={pendingCampaignId === campaign.id}
                            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="open">Open</option>
                            <option value="in_review">In review</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                No campaigns match the current filters.
              </div>
            )}
          </div>
        </div>
      ) : (
        <BrandCreatorDirectory
          brandId={brandId}
          campaigns={campaigns}
          creators={creators}
          preferredCampaignId={preferredCampaignId}
        />
      )}
    </div>
  );
}
