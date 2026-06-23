import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandWorkspace } from "@/components/dashboard/brand-workspace";
import { getDashboardContext } from "@/lib/data/platform";
import type { BrandDashboardData, CampaignStatus } from "@/lib/types";
import {
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatPercent,
} from "@/lib/utils";
import CreatorsAnalyticsFilters from "@/components/analytics/creators-analytics-filters";

export const dynamic = "force-dynamic";

type CreatorsAnalyticsPageProps = {
  searchParams?: Promise<{
    range?: string;
    creator?: string;
    product?: string;
    campaign?: string;
  }>;
};

type CampaignPerformanceSummary = {
  id: string;
  title: string;
  status: CampaignStatus;
  budget: number;
  creatorSlots: number;
  applications: number;
  accepted: number;
  submissions: number;
  approved: number;
  funded: number;
  paidOut: number;
  approvalRate: number;
};

function getDateValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function getAverage(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function safePercent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return (numerator / denominator) * 100;
}

function formatDurationDays(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0d";
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)}d`;
}

function normalizeFilterValue(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  return value;
}

function withinRange(value: string | null | undefined, days: number | null) {
  if (days === null) {
    return true;
  }

  const timestamp = getDateValue(value);
  if (!timestamp) {
    return false;
  }

  const now = Date.now();
  return now - timestamp <= days * 24 * 60 * 60 * 1000;
}

function getRangeDays(range: string) {
  if (range === "30d") {
    return 30;
  }

  if (range === "90d") {
    return 90;
  }

  if (range === "365d") {
    return 365;
  }

  return null;
}

function filterCreatorsAnalyticsData(
  data: BrandDashboardData,
  filters: {
    range: string;
    creator: string;
    product: string;
    campaign: string;
  },
) {
  const rangeDays = getRangeDays(filters.range);
  const campaignSeed = data.campaigns.filter((campaign) => {
    if (filters.product !== "all" && campaign.product_name !== filters.product) {
      return false;
    }

    if (filters.campaign !== "all" && campaign.id !== filters.campaign) {
      return false;
    }

    return withinRange(campaign.created_at, rangeDays);
  });
  const allowedCampaignIds = new Set(campaignSeed.map((campaign) => campaign.id));

  const applications = data.applications.filter((application) => {
    if (!allowedCampaignIds.has(application.campaign_id)) {
      return false;
    }

    if (filters.creator !== "all" && application.creator_id !== filters.creator) {
      return false;
    }

    return withinRange(application.created_at, rangeDays);
  });

  const submissions = data.submissions.filter((submission) => {
    if (!allowedCampaignIds.has(submission.campaign_id)) {
      return false;
    }

    if (filters.creator !== "all" && submission.creator_id !== filters.creator) {
      return false;
    }

    return withinRange(submission.submitted_at ?? submission.created_at, rangeDays);
  });

  const payouts = data.payouts.filter((payout) => {
    if (!allowedCampaignIds.has(payout.campaign_id)) {
      return false;
    }

    if (filters.creator !== "all" && payout.creator_id !== filters.creator) {
      return false;
    }

    return withinRange(payout.paid_at ?? payout.created_at, rangeDays);
  });

  const fundings = data.fundings.filter((funding) => {
    if (!funding.campaign_id || !allowedCampaignIds.has(funding.campaign_id)) {
      return false;
    }

    return withinRange(funding.paid_at ?? funding.created_at, rangeDays);
  });

  const creatorIdsFromFilteredRecords =
    filters.creator === "all"
      ? new Set([
        ...applications.map((item) => item.creator_id),
        ...submissions.map((item) => item.creator_id),
        ...payouts.map((item) => item.creator_id),
      ])
      : new Set([filters.creator]);

  const campaigns =
    filters.creator === "all"
      ? campaignSeed
      : campaignSeed.filter((campaign) =>
        applications.some((application) => application.campaign_id === campaign.id) ||
        submissions.some((submission) => submission.campaign_id === campaign.id) ||
        payouts.some((payout) => payout.campaign_id === campaign.id),
      );

  const creators = data.creators.filter((creator) => creatorIdsFromFilteredRecords.has(creator.id));

  return {
    ...data,
    campaigns,
    applications,
    submissions,
    payouts,
    fundings,
    creators,
  };
}

function buildCreatorsAnalytics(data: BrandDashboardData) {
  const totalBudget = data.campaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
  const totalPayoutsGross = data.payouts.reduce(
    (sum, payout) => sum + payout.amount,
    0,
  );
  const totalCreatorSlots = data.campaigns.reduce(
    (sum, campaign) => sum + campaign.creator_slots,
    0,
  );
  const acceptedApplications = data.applications.filter(
    (application) => application.status === "accepted",
  );
  const acceptedCount = acceptedApplications.length;
  const acceptedValue = acceptedApplications.reduce(
    (sum, application) => sum + application.rate,
    0,
  );
  const approvedSubmissions = data.submissions.filter(
    (submission) => submission.status === "approved",
  );
  const paidFundings = data.fundings.filter((funding) => funding.status === "paid");
  const paidFundingTotal = paidFundings.reduce(
    (sum, funding) => sum + funding.amount,
    0,
  );
  const paidPayouts = data.payouts.filter((payout) => payout.status === "paid");
  const paidPayoutCount = paidPayouts.length;
  const revisionRequests = data.submissions.filter(
    (submission) => submission.status === "revision_requested",
  ).length;

  const reviewDurations = data.submissions
    .map((submission) => {
      const submittedAt =
        getDateValue(submission.submitted_at) ?? getDateValue(submission.created_at);
      const reviewedAt = getDateValue(submission.reviewed_at);

      if (!submittedAt || !reviewedAt || reviewedAt < submittedAt) {
        return null;
      }

      return (reviewedAt - submittedAt) / (1000 * 60 * 60 * 24);
    })
    .filter((value): value is number => value !== null);

  const payoutDurations = data.payouts
    .map((payout) => {
      const createdAt = getDateValue(payout.created_at);
      const paidAt = getDateValue(payout.paid_at);

      if (!createdAt || !paidAt || paidAt < createdAt) {
        return null;
      }

      return (paidAt - createdAt) / (1000 * 60 * 60 * 24);
    })
    .filter((value): value is number => value !== null);

  const creatorConversionRate = safePercent(acceptedCount, data.applications.length);
  const submissionApprovalRate = safePercent(
    approvedSubmissions.length,
    data.submissions.length,
  );
  const payoutReleaseRate = safePercent(paidPayoutCount, data.payouts.length);
  const slotFillRate = safePercent(acceptedCount, totalCreatorSlots);
  const averageAcceptedRate = acceptedCount ? acceptedValue / acceptedCount : 0;
  const avgReviewTime = formatDurationDays(getAverage(reviewDurations));
  const avgPayoutTime = formatDurationDays(getAverage(payoutDurations));

  const metrics = [
    {
      label: "Creator conversion",
      value: formatPercent(creatorConversionRate),
      hint: "accepted from applications",
    },
    {
      label: "Submission approval",
      value: formatPercent(submissionApprovalRate),
      hint: "first-time pass",
    },
    {
      label: "Payout release rate",
      value: formatPercent(payoutReleaseRate),
      hint: "on time",
    },
    {
      label: "Avg. review time",
      value: avgReviewTime,
      hint: "submission to decision",
    },
  ];

  const funnel = [
    {
      label: "Slots opened",
      value: totalCreatorSlots,
      meta: `${data.campaigns.length} live briefs`,
    },
    {
      label: "Applications",
      value: data.applications.length,
      meta: `${formatPercent(
        safePercent(data.applications.length, Math.max(totalCreatorSlots, 1)),
      )} demand`,
    },
    {
      label: "Accepted",
      value: acceptedCount,
      meta: `${formatPercent(slotFillRate)} slot fill`,
    },
    {
      label: "Approved deliveries",
      value: approvedSubmissions.length,
      meta: `${formatPercent(submissionApprovalRate)} approval`,
    },
    {
      label: "Payouts released",
      value: paidPayoutCount,
      meta: `${formatPercent(payoutReleaseRate)}`,
    },
  ];
  const maxFunnelValue = Math.max(...funnel.map((item) => item.value), 1);

  const financeMetrics = [
    {
      label: "Avg. creator rate",
      value: formatCurrency(averageAcceptedRate),
    },
    {
      label: "Avg. payout time",
      value: avgPayoutTime,
    },
    {
      label: "Budget committed",
      value: formatCompactCurrency(totalPayoutsGross),
    },
    {
      label: "Revision rate",
      value: formatPercent(
        safePercent(revisionRequests, Math.max(data.submissions.length, 1)),
      ),
    },
  ];

  const topCreators = Object.values(
    data.submissions.reduce<
      Record<
        string,
        {
          name: string;
          submissions: number;
          approved: number;
        }
      >
    >((accumulator, submission) => {
      const key = submission.creator_name || submission.creator_id;
      const current = accumulator[key] ?? {
        name: submission.creator_name || "Creator",
        submissions: 0,
        approved: 0,
      };

      current.submissions += 1;
      if (submission.status === "approved") {
        current.approved += 1;
      }

      accumulator[key] = current;
      return accumulator;
    }, {}),
  )
    .sort((left, right) => {
      if (right.submissions !== left.submissions) {
        return right.submissions - left.submissions;
      }

      return right.approved - left.approved;
    })
    .slice(0, 5);

  const campaignPerformance: CampaignPerformanceSummary[] = data.campaigns
    .map((campaign) => {
      const applications = data.applications.filter(
        (application) => application.campaign_id === campaign.id,
      );
      const submissions = data.submissions.filter(
        (submission) => submission.campaign_id === campaign.id,
      );
      const fundings = paidFundings.filter(
        (funding) => funding.campaign_id === campaign.id,
      );
      const payouts = paidPayouts.filter((payout) => payout.campaign_id === campaign.id);
      const accepted = applications.filter(
        (application) => application.status === "accepted",
      ).length;
      const approved = submissions.filter(
        (submission) => submission.status === "approved",
      ).length;

      return {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        budget: campaign.budget,
        creatorSlots: campaign.creator_slots,
        applications: applications.length,
        accepted,
        submissions: submissions.length,
        approved,
        funded: fundings.reduce((sum, funding) => sum + funding.amount, 0),
        paidOut: payouts.reduce((sum, payout) => sum + payout.creator_amount, 0),
        approvalRate: safePercent(approved, Math.max(submissions.length, accepted)),
      };
    })
    .sort((left, right) => right.applications - left.applications)
    .slice(0, 6);

  return {
    metrics,
    funnel,
    maxFunnelValue,
    financeMetrics,
    topCreators,
    campaignPerformance,
    liveBriefs: data.campaigns.length,
    fundedTotal: formatCompactCurrency(paidFundingTotal),
    acceptedPipelineValue: formatCompactCurrency(
      acceptedApplications.reduce((sum, application) => sum + application.rate, 0),
    ),
  };
}

function CreatorsAnalyticsPageContent({
  data,
  filters,
  filterOptions,
}: {
  data: BrandDashboardData;
  filters: {
    range: string;
    creator: string;
    product: string;
    campaign: string;
  };
  filterOptions: {
    creators: Array<{ value: string; label: string }>;
    products: string[];
    campaigns: Array<{ value: string; label: string }>;
  };
}) {
  const analytics = buildCreatorsAnalytics(data);

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(247,250,255,0.98))] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
              Creator analytics
            </h2>
            <p className="mt-1 text-sm leading-7 text-slate-500">
              Pipeline health from brief to payout
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50"
          >
            Export
          </button>
        </div>
        {/* <div className="mt-5">
          <CreatorsAnalyticsFilters
            filters={filters}
            filterOptions={filterOptions}
          />
        </div> */}
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analytics.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[1.1rem] border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.04)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {metric.label}
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                {metric.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{metric.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <h3 className="text-[1.2rem] font-semibold text-slate-950">Performance funnel</h3>
          <div className="mt-5 space-y-4">
            {analytics.funnel.map((item) => (
              <div key={item.label}>
                <div className="flex items-end justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.label}
                    <span className="ml-1 font-medium text-slate-500">
                      - {item.meta}
                    </span>
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    {formatCompactNumber(item.value)}
                  </p>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,_#8FB3F4,_#6F9BEF)]"
                    style={{
                      width: `${Math.max(
                        12,
                        Math.round(safePercent(item.value, analytics.maxFunnelValue)),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <h3 className="text-[1.2rem] font-semibold text-slate-950">Finance & delivery</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {analytics.financeMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-[1.2rem] font-semibold text-slate-950">
                Top creators by submissions
              </h3>
              <span className="rounded-full border border-[rgba(7,107,210,0.14)] bg-[rgba(7,107,210,0.08)] px-3 py-1 text-xs font-semibold text-accent">
                {analytics.liveBriefs} live briefs
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {analytics.topCreators.length ? (
                analytics.topCreators.map((creator, index) => (
                  <div
                    key={`${creator.name}-${index}`}
                    className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {index + 1}. {creator.name}
                    </p>
                    <p className="text-sm font-semibold text-slate-600">
                      {creator.approved} approved
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1rem] border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  Creator rankings will appear once submissions start moving.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h3 className="text-[1.2rem] font-semibold text-slate-950">Campaign scorecard</h3>
            {/* <div className="text-sm font-medium text-slate-500">
              Sort: by demand
            </div> */}
          </div>
          <div className="mt-5 overflow-hidden rounded-[1.1rem] border border-slate-200">
            <div className="grid grid-cols-[minmax(0,1.4fr)_0.65fr_0.8fr_0.8fr_0.8fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span>Campaign</span>
              <span>Slots</span>
              <span>Applications</span>
              <span>Approval</span>
              <span>Funded</span>
            </div>
            <div className="divide-y divide-slate-200 bg-white">
              {analytics.campaignPerformance.length ? (
                analytics.campaignPerformance.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="grid grid-cols-[minmax(0,1.4fr)_0.65fr_0.8fr_0.8fr_0.8fr] gap-3 px-4 py-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {campaign.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {campaign.accepted} accepted / {campaign.submissions} submitted
                      </p>
                    </div>
                    <div className="text-slate-600">
                      {campaign.accepted}/{campaign.creatorSlots}
                    </div>
                    <div className="text-slate-600">{campaign.applications}</div>
                    <div className="text-slate-600">
                      {formatPercent(campaign.approvalRate)}
                    </div>
                    <div className="text-slate-600">
                      {formatCompactCurrency(campaign.funded)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  Launch a campaign to unlock your analytics scorecard.
                </div>
              )}
            </div>
          </div>
          {/* <div className="mt-3 text-xs text-slate-400">
            Backed by live workspace data. Funded total: {analytics.fundedTotal}
          </div> */}
        </div>
      </section>
    </div>
  );
}

export default async function BrandAnalyticsCreatorsPage({
  searchParams,
}: CreatorsAnalyticsPageProps) {
  const context = await getDashboardContext("analytics");

  if (!context) {
    redirect("/login");
  }

  if (context.role !== "brand") {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const filters = {
    range: normalizeFilterValue(params.range),
    creator: normalizeFilterValue(params.creator),
    product: normalizeFilterValue(params.product),
    campaign: normalizeFilterValue(params.campaign),
  };
  const filteredData = filterCreatorsAnalyticsData(context.data, filters);
  const filteredAnalytics = buildCreatorsAnalytics(filteredData);
  const filterOptions = {
    creators: context.data.creators
      .map((creator) => ({
        value: creator.id,
        label: creator.name,
      }))
      .sort((left, right) => left.label.localeCompare(right.label)),
    products: [...new Set(context.data.campaigns.map((campaign) => campaign.product_name))]
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right)),
    campaigns: context.data.campaigns
      .map((campaign) => ({
        value: campaign.id,
        label: campaign.title,
      }))
      .sort((left, right) => left.label.localeCompare(right.label)),
  };

  return (
    <BrandWorkspace
      profile={context.profile}
      data={context.data}
      section="analytics"
      renderMode="content"
      detailView={{
        title: "Analytics / Creators",
        description:
          "Track creator conversion, approval flow, and recent approved content from the same analytics surface.",
        metaItems: [
          {
            label: "Live campaigns",
            value: String(filteredData.campaigns.length),
          },
          {
            label: "Approved deliveries",
            value: String(
              filteredData.submissions.filter(
                (submission) => submission.status === "approved",
              ).length,
            ),
          },
          {
            label: "Accepted pipeline",
            value: filteredAnalytics.acceptedPipelineValue,
          },
        ],
        content: (
          <CreatorsAnalyticsPageContent
            data={filteredData}
            filters={filters}
            filterOptions={filterOptions}
          />
        ),
      }}
    />
  );
}
