"use client";

import Link from "next/link";
import type { BrandDashboardData } from "@/lib/types";

type Props = {
  data: BrandDashboardData;
};

type AttentionItem = {
  id: string;
  title: string;
  subtitle: string;
  when: string;
  href: string;
  tone: "red" | "amber" | "blue";
};

type ActivityItem = {
  id: string;
  actor: string;
  actorTone: "blue" | "slate";
  title: string;
  when: string;
};

function getDateValue(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getRelativeTime(value: string | null | undefined) {
  const date = getDateValue(value);
  if (!date) return "recently";

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

function formatDayLabel(value: string | null | undefined) {
  const date = getDateValue(value);
  if (!date) return "today";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays > 1 && diffDays < 7) {
    return target.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (diffDays < 0 && diffDays > -7) {
    return `${Math.abs(diffDays)}d`;
  }

  return target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getAttentionItems(data: BrandDashboardData): AttentionItem[] {
  const items: AttentionItem[] = [];

  const pendingSubmissions = data.submissions
    .filter((submission) => submission.status === "submitted")
    .sort((left, right) => {
      const rightValue = getDateValue(right.submitted_at ?? right.created_at)?.getTime() ?? 0;
      const leftValue = getDateValue(left.submitted_at ?? left.created_at)?.getTime() ?? 0;
      return rightValue - leftValue;
    });

  if (pendingSubmissions.length) {
    const lead = pendingSubmissions[0];
    items.push({
      id: "pending-submissions",
      title: `Review ${pendingSubmissions.length} new submission${pendingSubmissions.length > 1 ? "s" : ""}`,
      subtitle: `@${lead.creator_name.toLowerCase().replace(/\s+/g, "")} | ${lead.campaign_title}`,
      when: getRelativeTime(lead.submitted_at ?? lead.created_at),
      href: "/dashboard/submissions",
      tone: "red",
    });
  }

  const pendingApplications = data.applications
    .filter((application) => application.status === "pending")
    .sort((left, right) => {
      const rightValue = getDateValue(right.created_at)?.getTime() ?? 0;
      const leftValue = getDateValue(left.created_at)?.getTime() ?? 0;
      return rightValue - leftValue;
    });

  if (pendingApplications.length) {
    const groupedByCampaign = new Map<string, number>();
    pendingApplications.forEach((application) => {
      groupedByCampaign.set(
        application.campaign_title,
        (groupedByCampaign.get(application.campaign_title) ?? 0) + 1,
      );
    });
    const topCampaign = Array.from(groupedByCampaign.entries()).sort((a, b) => b[1] - a[1])[0];

    items.push({
      id: "pending-applications",
      title: `Approve ${pendingApplications.length} creator application${pendingApplications.length > 1 ? "s" : ""}`,
      subtitle: topCampaign ? topCampaign[0] : "Creator campaign queue",
      when: formatDayLabel(pendingApplications[0].created_at),
      href: "/dashboard/creators",
      tone: "amber",
    });
  }

  const draftCampaign = data.campaigns
    .filter((campaign) => campaign.status === "open")
    .sort((left, right) => {
      const rightValue = getDateValue(right.created_at)?.getTime() ?? 0;
      const leftValue = getDateValue(left.created_at)?.getTime() ?? 0;
      return rightValue - leftValue;
    })[0];

  if (draftCampaign) {
    items.push({
      id: "campaign-brief",
      title: `Finish brief - ${draftCampaign.title}`,
      subtitle: `Budget ${formatCurrency(draftCampaign.budget)}`,
      when: formatDayLabel(draftCampaign.created_at),
      href: "/dashboard/creators/campaigns",
      tone: "amber",
    });
  }

  const payoutReadyCount = data.payouts.filter((payout) => payout.status === "payout_ready").length;
  const payoutReadyAmount = data.payouts
    .filter((payout) => payout.status === "payout_ready")
    .reduce((sum, payout) => sum + payout.creator_amount, 0);

  if (payoutReadyCount) {
    items.push({
      id: "payout-ready",
      title: `Payout due ${formatCurrency(payoutReadyAmount)}`,
      subtitle: `${payoutReadyCount} creator${payoutReadyCount > 1 ? "s" : ""} awaiting release`,
      when: "finance",
      href: "/dashboard/finance",
      tone: "blue",
    });
  }

  return items.slice(0, 5);
}

function getActivityItems(data: BrandDashboardData): ActivityItem[] {
  const items: Array<ActivityItem & { sortValue: number }> = [];

  data.applications
    .filter((application) => application.status === "accepted")
    .forEach((application) => {
      items.push({
        id: `application-${application.id}`,
        actor: getInitials(application.creator_name),
        actorTone: "blue",
        title: `${application.creator_name} accepted into ${application.campaign_title}`,
        when: getRelativeTime(application.created_at),
        sortValue: getDateValue(application.created_at)?.getTime() ?? 0,
      });
    });

  data.submissions.forEach((submission) => {
    items.push({
      id: `submission-${submission.id}`,
      actor: getInitials(submission.creator_name),
      actorTone: "slate",
      title: `${submission.creator_name} submitted work for ${submission.campaign_title}`,
      when: getRelativeTime(submission.submitted_at ?? submission.created_at),
      sortValue: getDateValue(submission.submitted_at ?? submission.created_at)?.getTime() ?? 0,
    });
  });

  data.payouts
    .filter((payout) => payout.status === "paid")
    .forEach((payout) => {
      items.push({
        id: `payout-${payout.id}`,
        actor: "$",
        actorTone: "slate",
        title: `Finance paid ${formatCurrency(payout.creator_amount)} to ${payout.creator_name}`,
        when: getRelativeTime(payout.paid_at ?? payout.created_at),
        sortValue: getDateValue(payout.paid_at ?? payout.created_at)?.getTime() ?? 0,
      });
    });

  data.campaigns
    .filter((campaign) => campaign.status === "active")
    .forEach((campaign) => {
      items.push({
        id: `campaign-${campaign.id}`,
        actor: "*",
        actorTone: "blue",
        title: `Campaign "${campaign.title}" is now live`,
        when: getRelativeTime(campaign.created_at),
        sortValue: getDateValue(campaign.created_at)?.getTime() ?? 0,
      });
    });

  return items
    .sort((left, right) => right.sortValue - left.sortValue)
    .slice(0, 5)
    .map(({ sortValue: _sortValue, ...item }) => item);
}

export function BrandActivityPanels({ data }: Props) {
  const attentionItems = getAttentionItems(data);
  const activityItems = getActivityItems(data);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <section className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_14px_44px_rgba(15,23,42,0.05)] sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-[1.2rem] font-semibold tracking-tight text-slate-950">
                Needs your attention
              </h3>
              {/* <p className="text-sm text-slate-400">{attentionItems.length} items | today</p> */}
            </div>
          </div>
          {/* <Link
            href="/dashboard/submissions"
            className="text-sm font-semibold text-[#0B57FF] transition hover:opacity-80"
          >
            Open inbox ->
          </Link> */}
        </div>

        <div className="mt-6 space-y-1">
          {attentionItems.length ? (
            attentionItems.map((item, index) => (
              <div
                key={item.id}
                // href={item.href}
                className={`flex items-center gap-4 py-4 transition hover:bg-slate-50 ${index > 0 ? "border-t border-slate-200/80" : ""}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.tone === "red"
                    ? "bg-rose-50"
                    : item.tone === "amber"
                      ? "bg-amber-50"
                      : "bg-blue-50"
                    }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${item.tone === "red"
                      ? "bg-rose-500"
                      : item.tone === "amber"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                      }`}
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9rem] font-medium text-slate-950">{item.title}</p>
                  <p className="mt-1 truncate text-[0.8rem] text-slate-500">{item.subtitle}</p>
                </div>

                <span className="hidden shrink-0 text-[0.8rem] text-slate-400 sm:block">{item.when}</span>

                {/* <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.25 3.5L8.75 7L5.25 10.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span> */}
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-400">
              No urgent items right now.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_14px_44px_rgba(15,23,42,0.05)] sm:px-6 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[1.2rem] font-semibold tracking-tight text-slate-950">
              Recent activity
            </h3>
            {/* <p className="text-sm text-slate-400">Live feed | newest first</p> */}
          </div>
          {/* <Link
            href="/dashboard/chat"
            className="text-sm font-semibold text-[#0B57FF] transition hover:opacity-80"
          >
            See all ->
          </Link> */}
        </div>

        <div className="mt-6">
          {activityItems.length ? (
            activityItems.map((item, index) => (
              <div key={item.id} className="flex gap-4">
                <div className="flex w-9 flex-col items-center">
                  <span
                    className={`${index !== activityItems.length - 1 && "h-full"} flex h-9 w-9 max-h-9  items-center justify-center rounded-full border text-xs font-semibold ${item.actorTone === "blue"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                  >
                    {item.actor}
                  </span>
                  {index < activityItems.length - 1 ? (
                    <span className="mt-1 h-full w-px bg-slate-200" />
                  ) : null}
                </div>

                <div className={`flex-1 pb-6 ${index === activityItems.length - 1 ? "pb-0" : ""}`}>
                  <p className="text-[0.9rem] font-medium text-slate-950">{item.title}</p>
                  <p className="mt-1 text-[0.8rem] text-slate-400">{item.when}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-400">
              Activity will appear here once creator work starts moving.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
