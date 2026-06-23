"use client";

import type { BrandDashboardData } from "@/lib/types";
import type { TimeFilter } from "@/components/dashboard/pipeline-revenue-chart";

type Props = {
  data: BrandDashboardData;
  activeFilter: TimeFilter;
};

type PerformanceCard = {
  label: string;
  value: string;
  delta: string;
  deltaTone: "positive" | "warning";
};

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

function getDateValue(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function isWithinRange(
  value: string | null | undefined,
  start: Date,
  endExclusive: Date,
) {
  const date = getDateValue(value);
  if (!date) return false;

  return date >= start && date < endExclusive;
}

function formatRoas(value: number) {
  return `${value.toFixed(1)}x`;
}

function getDays(filter: TimeFilter) {
  if (filter === "7D") return 7;
  if (filter === "14D") return 14;
  if (filter === "30D") return 30;
  return 90;
}

export function BrandPerformanceCards({ data, activeFilter }: Props) {
  const days = getDays(activeFilter);
  const today = startOfLocalDay(new Date());
  const currentWindowStart = addDays(today, -(days - 1));
  const nextDay = addDays(today, 1);
  const previousWindowStart = addDays(currentWindowStart, -days);
  const previousWindowEnd = currentWindowStart;

  const activeCampaigns = data.campaigns.filter(
    (campaign) => campaign.status === "open" || campaign.status === "active",
  );
  const activeCampaignIds = new Set(activeCampaigns.map((campaign) => campaign.id));

  const currentCampaignLaunches = data.campaigns.filter((campaign) =>
    isWithinRange(campaign.created_at, currentWindowStart, nextDay),
  ).length;

  const liveCreatorIds = new Set<string>();
  data.applications.forEach((application) => {
    if (
      activeCampaignIds.has(application.campaign_id) &&
      (application.status === "accepted" || application.status === "shortlisted")
    ) {
      liveCreatorIds.add(application.creator_id);
    }
  });
  data.submissions.forEach((submission) => {
    if (activeCampaignIds.has(submission.campaign_id)) {
      liveCreatorIds.add(submission.creator_id);
    }
  });

  const currentWindowLiveCreators = new Set<string>();
  data.applications.forEach((application) => {
    if (
      activeCampaignIds.has(application.campaign_id) &&
      (application.status === "accepted" || application.status === "shortlisted") &&
      isWithinRange(application.created_at, currentWindowStart, nextDay)
    ) {
      currentWindowLiveCreators.add(application.creator_id);
    }
  });
  data.submissions.forEach((submission) => {
    if (
      activeCampaignIds.has(submission.campaign_id) &&
      isWithinRange(
        submission.submitted_at ?? submission.created_at,
        currentWindowStart,
        nextDay,
      )
    ) {
      currentWindowLiveCreators.add(submission.creator_id);
    }
  });

  const pendingSubmissions = data.submissions.filter(
    (submission) => submission.status === "submitted",
  );
  const newPendingSubmissions = pendingSubmissions.filter((submission) =>
    isWithinRange(
      submission.submitted_at ?? submission.created_at,
      currentWindowStart,
      nextDay,
    ),
  ).length;

  const currentPipelineRevenue = data.submissions
    .filter(
      (submission) =>
        submission.status === "approved" &&
        isWithinRange(
          submission.reviewed_at ?? submission.created_at,
          currentWindowStart,
          nextDay,
        ),
    )
    .reduce((sum, submission) => sum + submission.rate, 0);

  const previousPipelineRevenue = data.submissions
    .filter(
      (submission) =>
        submission.status === "approved" &&
        isWithinRange(
          submission.reviewed_at ?? submission.created_at,
          previousWindowStart,
          previousWindowEnd,
        ),
    )
    .reduce((sum, submission) => sum + submission.rate, 0);

  const currentSpend = data.fundings
    .filter(
      (funding) =>
        funding.status === "paid" &&
        isWithinRange(funding.created_at, currentWindowStart, nextDay),
    )
    .reduce((sum, funding) => sum + funding.amount, 0);

  const previousSpend = data.fundings
    .filter(
      (funding) =>
        funding.status === "paid" &&
        isWithinRange(funding.created_at, previousWindowStart, previousWindowEnd),
    )
    .reduce((sum, funding) => sum + funding.amount, 0);

  const roas = currentSpend > 0 ? currentPipelineRevenue / currentSpend : 0;
  const previousRoas = previousSpend > 0 ? previousPipelineRevenue / previousSpend : 0;
  const roasDelta = roas - previousRoas;

  const cards: PerformanceCard[] = [
    {
      label: "Active campaigns",
      value: String(activeCampaigns.length),
      delta: `${currentCampaignLaunches} launched`,
      deltaTone: "positive",
    },
    {
      label: "Creators live",
      value: String(liveCreatorIds.size),
      delta: `${currentWindowLiveCreators.size} active`,
      deltaTone: "positive",
    },
    {
      label: "Submissions pending",
      value: String(pendingSubmissions.length),
      delta: `${newPendingSubmissions} new`,
      deltaTone: "warning",
    },
    {
      label: "ROAS",
      value: formatRoas(roas),
      delta: `${roasDelta >= 0 ? "+" : ""}${roasDelta.toFixed(1)} vs prev`,
      deltaTone: "positive",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-[24px] border border-slate-200/80 bg-white px-6 py-5 shadow-[0_12px_36px_rgba(15,23,42,0.05)]"
        >
          <p className="text-lg font-semibold capitalize text-slate-500">
            {card.label}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-[28px] font-semibold leading-none tracking-[-0.05em] text-slate-950">
              {card.value}
            </span>
            <span
              className={`pb-1 text-sm font-semibold ${card.deltaTone === "warning"
                ? "text-amber-500"
                : "text-emerald-500"
                }`}
            >
              {card.delta}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
