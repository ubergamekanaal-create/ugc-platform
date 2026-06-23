"use client";

import type { ReactNode } from "react";
import { WorkspacePanel } from "@/components/dashboard/workspace-shell";
import type {
  BrandDashboardData,
  BrandSubmissionSummary,
  CampaignStatus,
} from "@/lib/types";
import {
  cn,
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/utils";

export type BrandAnalyticsView = "overview" | "ads" | "creators";

type BrandAnalyticsContentProps = {
  data: BrandDashboardData;
  view: BrandAnalyticsView;
};

type CampaignPerformanceSummary = {
  id: string;
  title: string;
  status: CampaignStatus;
  budget: number;
  creatorSlots: number;
  applications: number;
  shortlisted: number;
  accepted: number;
  submissions: number;
  approved: number;
  revisionRequested: number;
  funded: number;
  paidOut: number;
  averageRate: number;
  slotFillRate: number;
  approvalRate: number;
};

function getDateValue(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function getAverage(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function safePercent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

function formatDurationDays(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0d";
  return `${value.toFixed(value >= 10 ? 0 : 1)}d`;
}

function getStatusClasses(status: string) {
  if (status === "accepted" || status === "approved" || status === "connected")
    return "bg-emerald-50 text-emerald-700";
  if (
    status === "shortlisted" ||
    status === "revision_requested" ||
    status === "active" ||
    status === "submitted"
  )
    return "bg-blue-50 text-blue-700";
  if (status === "rejected" || status === "declined")
    return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function AnalyticsPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <WorkspacePanel className={className}>{children}</WorkspacePanel>;
}

function MetricStrip({
  metrics,
}: {
  metrics: Array<{
    label: string;
    value: string;
    positive?: boolean | null;
  }>;
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
        >
          <p className="text-xs font-medium text-slate-400">{m.label}</p>
          <p className="mt-2 text-[1rem] font-semibold text-slate-950">
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function PerformanceOverTimePanel() {
  return (
    <AnalyticsPanel className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Performance over time
          </h2>
        </div>
        <button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
          Metric: ROAS ▾
        </button>
      </div>
      <div className="mt-4 flex h-44 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        [ line chart: ROAS by day, optionally split by creative ]
      </div>
    </AnalyticsPanel>
  );
}

function TopCreativesPanel({
  campaignPerformance,
}: {
  campaignPerformance: CampaignPerformanceSummary[];
}) {
  const top3 = campaignPerformance.slice(0, 3);
  return (
    <AnalyticsPanel className="p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[1.2rem] font-semibold text-slate-950">
          Top performing creatives
        </h2>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-slate-950 inline-block" />
            Grid
          </span>
          <span className="text-slate-300">|</span>
          <span>List</span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {top3.length ? (
          top3.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3"
            >
              {/* thumbnail placeholder */}
              <div className="h-24 rounded-lg border border-slate-200 bg-white" />
              <div>
                <p className="text-sm font-semibold text-slate-950 truncate">
                  {c.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatPercent(c.approvalRate)} approval ·{" "}
                  {formatCompactCurrency(c.paidOut)} spend
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
            Top creatives will appear once campaigns move through review.
          </div>
        )}
      </div>
    </AnalyticsPanel>
  );
}

function BreakdownPanel({
  campaignPerformance,
}: {
  campaignPerformance: CampaignPerformanceSummary[];
}) {
  return (
    <AnalyticsPanel className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[1.2rem] font-semibold text-slate-950">Breakdown</h2>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button className="text-accent">By creator</button>
          <span className="text-slate-300">·</span>
          <button className="hover:text-slate-950 transition">
            By product
          </button>
          <span className="text-slate-300">·</span>
          <button className="hover:text-slate-950 transition">
            By campaign
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-[minmax(0,1.6fr)_0.8fr_0.8fr_0.7fr_0.7fr_0.7fr] gap-2 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          <span>Dimension</span>
          <span>Spend</span>
          <span>Purchases</span>
          <span>ROAS</span>
          <span>CPA</span>
          <span>CTR</span>
        </div>
        <div className="divide-y divide-slate-100 bg-white">
          {campaignPerformance.length ? (
            campaignPerformance.map((c) => {
              const roas = c.budget > 0 ? c.paidOut / Math.max(c.funded, 1) : 0;
              return (
                <div
                  key={c.id}
                  className="grid grid-cols-[minmax(0,1.6fr)_0.8fr_0.8fr_0.7fr_0.7fr_0.7fr] gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-950">
                      {c.title}
                    </p>
                    <span
                      className={cn(
                        "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
                        getStatusClasses(c.status),
                      )}
                    >
                      {c.status}
                    </span>
                  </div>
                  <span>{formatCompactCurrency(c.funded)}</span>
                  <span>{c.approved}</span>
                  <span>{roas > 0 ? `${roas.toFixed(1)}x` : "—"}</span>
                  <span>
                    {c.approved > 0
                      ? formatCurrency(c.funded / c.approved)
                      : "—"}
                  </span>
                  <span>{formatPercent(c.slotFillRate)}</span>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-10 text-center text-sm text-slate-400">
              [ sortable table: dimension · spend · purchases · ROAS · CPA · CTR
              ]
            </div>
          )}
        </div>
      </div>
    </AnalyticsPanel>
  );
}

function FunnelPanel({
  funnel,
  maxFunnelValue,
}: {
  funnel: Array<{ label: string; value: number; meta: string }>;
  maxFunnelValue: number;
}) {
  return (
    <AnalyticsPanel className="p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Performance Funnel
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          From campaign launches to approved creator work.
        </p>
      </div>
      <div className="mt-5 space-y-4">
        {funnel.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-slate-700">
                  {item.label}
                </span>
                <p className="mt-0.5 text-xs text-slate-500">{item.meta}</p>
              </div>
              <span className="text-sm font-semibold text-slate-600">
                {formatCompactNumber(item.value)}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#076BD2,_#60A5FA)]"
                style={{
                  width: `${Math.max(10, Math.round(safePercent(item.value, maxFunnelValue)))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </AnalyticsPanel>
  );
}

function TopContentPanel({
  approvedDeliveries,
}: {
  approvedDeliveries: BrandSubmissionSummary[];
}) {
  return (
    <AnalyticsPanel className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Top Content</h2>
          <p className="mt-1 text-sm text-slate-500">
            Recently approved deliveries with the strongest completion signals.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {approvedDeliveries.length} approved
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {approvedDeliveries.length ? (
          approvedDeliveries.map((submission) => (
            <div
              key={submission.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-950">
                    {submission.creator_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {submission.campaign_title}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Approved
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  {
                    label: "Creator payout",
                    value: formatCurrency(submission.rate),
                  },
                  {
                    label: "Assets delivered",
                    value: String(
                      submission.assets.length +
                      submission.content_links.length,
                    ),
                  },
                  {
                    label: "Reviewed",
                    value: submission.reviewed_at
                      ? formatDate(submission.reviewed_at)
                      : "Pending",
                  },
                  {
                    label: "Revision",
                    value: `V${submission.revision_number}`,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg bg-slate-50 px-3 py-2.5"
                  >
                    <p className="text-xs text-slate-500">{stat.label}</p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              {submission.feedback && (
                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-950">Review note</p>
                  <p className="mt-1">{submission.feedback}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-400">
            Approved creator deliveries will appear here once campaigns move
            through review.
          </div>
        )}
      </div>
    </AnalyticsPanel>
  );
}

function CreatorsAnalyticsBoard({
  metrics,
  funnel,
  maxFunnelValue,
  financeMetrics,
  campaignPerformance,
  topCreators,
}: {
  metrics: Array<{ label: string; value: string; hint: string }>;
  funnel: Array<{ label: string; value: number; meta: string }>;
  maxFunnelValue: number;
  financeMetrics: Array<{ label: string; value: string }>;
  campaignPerformance: CampaignPerformanceSummary[];
  topCreators: Array<{ name: string; submissions: number; approved: number }>;
}) {
  return (
    <AnalyticsPanel className="overflow-hidden border-slate-200 p-0">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Creator analytics
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Creator performance board
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
              Pipeline health from creator sourcing through approvals and payout
              release.
            </p>
          </div>
          <div className="rounded-full border border-[rgba(7,107,210,0.14)] bg-[rgba(7,107,210,0.06)] px-4 py-2 text-xs font-semibold text-accent">
            Live workspace data
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* KPI row */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.04)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{metric.hint}</p>
            </div>
          ))}
          <div className="rounded-xl border border-[rgba(7,107,210,0.12)] bg-[rgba(7,107,210,0.04)] p-4 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Pipeline
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {funnel.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Funnel stages monitored from sourcing to payouts.
            </p>
          </div>
        </div>

        {/* Funnel + top creators */}
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
            <h3 className="text-base font-semibold text-slate-950">
              Performance funnel
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Brief demand and creator progression through approval.
            </p>
            <div className="mt-5 space-y-4">
              {funnel.map((item) => (
                <div key={item.label}>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {item.meta}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">
                      {formatCompactNumber(item.value)}
                    </p>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,_#076BD2,_#60A5FA)]"
                      style={{
                        width: `${Math.max(12, Math.round(safePercent(item.value, maxFunnelValue)))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-950">
                Top creators by submissions
              </h3>
              <span className="rounded-full bg-[rgba(7,107,210,0.08)] px-2.5 py-1 text-xs font-semibold text-accent">
                {topCreators.length} creators
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {topCreators.length ? (
                topCreators.map((creator, index) => (
                  <div
                    key={`${creator.name}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)]">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {creator.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {creator.submissions} submissions
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {creator.approved} approved
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                  Rankings will appear once submissions start moving.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Finance + scorecard table */}
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
            <h3 className="text-base font-semibold text-slate-950">
              Finance & delivery
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Payout and delivery signals attached to your creator pipeline.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {financeMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="text-xs text-slate-500">{metric.label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-950">
                Campaign scorecard
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                Sorted by demand
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[minmax(0,1.4fr)_0.7fr_0.7fr_0.8fr_0.8fr] gap-3 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                <span>Campaign</span>
                <span>Slots</span>
                <span>Applications</span>
                <span>Approval</span>
                <span>Paid out</span>
              </div>
              <div className="divide-y divide-slate-100 bg-white">
                {campaignPerformance.length ? (
                  campaignPerformance.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="grid grid-cols-[minmax(0,1.4fr)_0.7fr_0.7fr_0.8fr_0.8fr] gap-3 px-4 py-3.5 text-sm hover:bg-slate-50 transition"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">
                          {campaign.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {campaign.shortlisted} shortlisted ·{" "}
                          {campaign.accepted} accepted
                        </p>
                      </div>
                      <div className="text-slate-600 text-sm">
                        {campaign.accepted}/{campaign.creatorSlots}
                      </div>
                      <div className="text-slate-600 text-sm">
                        {campaign.applications}
                      </div>
                      <div className="text-slate-600 text-sm">
                        {formatPercent(campaign.approvalRate)}
                      </div>
                      <div className="text-slate-600 text-sm">
                        {formatCompactCurrency(campaign.paidOut)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-slate-400">
                    Launch a campaign to unlock your scorecard.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsPanel>
  );
}

export function BrandAnalyticsContent({
  data,
  view,
}: BrandAnalyticsContentProps) {
  const totalBudget = data.campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalPayoutsGross = data.payouts.reduce((sum, p) => sum + p.amount, 0);
  const paidFundingTotal = data.fundings
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + f.amount, 0);
  const payoutReadyTotal = data.payouts
    .filter((p) => p.status === "payout_ready")
    .reduce((sum, p) => sum + p.creator_amount, 0);
  const paidPayoutCount = data.payouts.filter(
    (p) => p.status === "paid",
  ).length;
  const totalCreatorSlots = data.campaigns.reduce(
    (sum, c) => sum + c.creator_slots,
    0,
  );
  const acceptedCount = data.applications.filter(
    (a) => a.status === "accepted",
  ).length;
  const acceptedValue = data.applications
    .filter((a) => a.status === "accepted")
    .reduce((sum, a) => sum + a.rate, 0);
  const approvedSubmissions = data.submissions.filter(
    (s) => s.status === "approved",
  );
  const revisionRequests = data.submissions.filter(
    (s) => s.status === "revision_requested",
  ).length;
  const submissionApprovalRate = safePercent(
    approvedSubmissions.length,
    data.submissions.length,
  );
  const creatorConversionRate = safePercent(
    acceptedCount,
    data.applications.length,
  );
  const payoutReleaseRate = safePercent(paidPayoutCount, data.payouts.length);
  const slotFillRate = safePercent(acceptedCount, totalCreatorSlots);
  const fundingCoverageRate = safePercent(paidFundingTotal, totalBudget);
  const budgetCommittedRate = safePercent(totalPayoutsGross, totalBudget);
  const averageAcceptedRate = acceptedCount
    ? acceptedValue / acceptedCount
    : data.applications.length
      ? data.applications.reduce((sum, a) => sum + a.rate, 0) /
      data.applications.length
      : 0;

  const reviewDurations = data.submissions
    .map((s) => {
      const submittedAt =
        getDateValue(s.submitted_at) ?? getDateValue(s.created_at);
      const reviewedAt = getDateValue(s.reviewed_at);
      if (!submittedAt || !reviewedAt || reviewedAt < submittedAt) return null;
      return (reviewedAt - submittedAt) / (1000 * 60 * 60 * 24);
    })
    .filter((v): v is number => v !== null);

  const payoutDurations = data.payouts
    .map((p) => {
      const createdAt = getDateValue(p.created_at);
      const paidAt = getDateValue(p.paid_at);
      if (!createdAt || !paidAt || paidAt < createdAt) return null;
      return (paidAt - createdAt) / (1000 * 60 * 60 * 24);
    })
    .filter((v): v is number => v !== null);

  const campaignPerformance: CampaignPerformanceSummary[] = data.campaigns
    .map((campaign) => {
      const apps = data.applications.filter(
        (a) => a.campaign_id === campaign.id,
      );
      const subs = data.submissions.filter(
        (s) => s.campaign_id === campaign.id,
      );
      const pays = data.payouts.filter((p) => p.campaign_id === campaign.id);
      const funds = data.fundings.filter(
        (f) => f.campaign_id === campaign.id && f.status === "paid",
      );
      const accepted = apps.filter((a) => a.status === "accepted").length;
      const approved = subs.filter((s) => s.status === "approved").length;
      const rates = apps.map((a) => a.rate);
      return {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        budget: campaign.budget,
        creatorSlots: campaign.creator_slots,
        applications: apps.length,
        shortlisted: apps.filter((a) => a.status === "shortlisted").length,
        accepted,
        submissions: subs.length,
        approved,
        revisionRequested: subs.filter((s) => s.status === "revision_requested")
          .length,
        funded: funds.reduce((sum, f) => sum + f.amount, 0),
        paidOut: pays
          .filter((p) => p.status === "paid")
          .reduce((sum, p) => sum + p.creator_amount, 0),
        averageRate: rates.length ? getAverage(rates) : 0,
        slotFillRate: safePercent(accepted, campaign.creator_slots),
        approvalRate: safePercent(approved, Math.max(subs.length, accepted)),
      };
    })
    .sort((l, r) => {
      const d =
        r.approved * 5 +
        r.accepted * 3 +
        r.applications -
        (l.approved * 5 + l.accepted * 3 + l.applications);
      return d !== 0 ? d : r.budget - l.budget;
    });

  const analyticsFunnel = [
    {
      label: "Creator slots opened",
      value: totalCreatorSlots,
      meta: `${data.campaigns.length} live briefs`,
    },
    {
      label: "Applications received",
      value: data.applications.length,
      meta: `${formatPercent(safePercent(data.applications.length, Math.max(totalCreatorSlots, 1)))} demand per slot`,
    },
    {
      label: "Creators accepted",
      value: acceptedCount,
      meta: `${formatPercent(slotFillRate)} slot fill`,
    },
    {
      label: "Approved deliveries",
      value: approvedSubmissions.length,
      meta: `${formatPercent(submissionApprovalRate)} approval rate`,
    },
    {
      label: "Payouts released",
      value: paidPayoutCount,
      meta: `${formatPercent(payoutReleaseRate)} released`,
    },
  ];
  const maxFunnelValue = Math.max(...analyticsFunnel.map((i) => i.value), 1);

  const approvedDeliveries = approvedSubmissions
    .slice()
    .sort(
      (l, r) =>
        (getDateValue(r.reviewed_at) ?? 0) - (getDateValue(l.reviewed_at) ?? 0),
    )
    .slice(0, 5);

  const topCreators = Object.values(
    data.submissions.reduce<
      Record<string, { name: string; submissions: number; approved: number }>
    >((acc, s) => {
      const key = s.creator_name || s.creator_id;
      const cur = acc[key] ?? {
        name: s.creator_name || "Creator",
        submissions: 0,
        approved: 0,
      };
      cur.submissions += 1;
      if (s.status === "approved") cur.approved += 1;
      acc[key] = cur;
      return acc;
    }, {}),
  )
    .sort((l, r) =>
      r.submissions !== l.submissions
        ? r.submissions - l.submissions
        : r.approved - l.approved,
    )
    .slice(0, 5);

  const overviewMetrics = [
    {
      label: "Creator conversion",
      value: formatPercent(creatorConversionRate),
      hint: `${acceptedCount} accepted from ${data.applications.length} applications`,
    },
    {
      label: "Submission approval",
      value: formatPercent(submissionApprovalRate),
      hint: `${approvedSubmissions.length} approved deliveries`,
    },
    {
      label: "Payout release rate",
      value: formatPercent(payoutReleaseRate),
      hint: `${paidPayoutCount} of ${data.payouts.length} payouts released`,
    },
    {
      label: "Avg. review time",
      value: formatDurationDays(getAverage(reviewDurations)),
      hint: reviewDurations.length
        ? `${reviewDurations.length} reviewed submissions`
        : "No completed reviews yet",
    },
  ];

  const adsMetrics = [
    {
      label: "Purchase value",
      value: formatPercent(fundingCoverageRate),
      hint: `${formatCompactCurrency(paidFundingTotal)} funded of ${formatCompactCurrency(totalBudget)}`,
    },
    {
      label: "Spend",
      value: formatPercent(budgetCommittedRate),
      hint: `${formatCompactCurrency(totalPayoutsGross)} allocated gross`,
    },
    {
      label: "ROAS",
      value: formatPercent(payoutReleaseRate),
      hint: `${paidPayoutCount} of ${data.payouts.length} payouts released`,
    },
    {
      label: "CPA",
      value: formatDurationDays(getAverage(payoutDurations)),
      hint: payoutDurations.length
        ? `${payoutDurations.length} payouts completed`
        : "No released payouts yet",
    },
  ];

  const creatorMetrics = [
    {
      label: "Creator conversion",
      value: formatPercent(creatorConversionRate),
      hint: `${acceptedCount} accepted from ${data.applications.length} applications`,
    },
    {
      label: "Submission approval",
      value: formatPercent(submissionApprovalRate),
      hint: `${approvedSubmissions.length} approved deliveries`,
    },
    {
      label: "Avg. creator rate",
      value: formatCurrency(averageAcceptedRate),
      hint: acceptedCount
        ? `${acceptedCount} accepted creators`
        : "No accepted creators yet",
    },
    {
      label: "Avg. review time",
      value: formatDurationDays(getAverage(reviewDurations)),
      hint: reviewDurations.length
        ? `${reviewDurations.length} reviewed submissions`
        : "No completed reviews yet",
    },
  ];

  const financeMetrics = [
    {
      label: "AOV",
      value: formatPercent(fundingCoverageRate),
    },
    {
      label: "CPA (link)",
      value: formatPercent(budgetCommittedRate),
    },
    {
      label: "CTR",
      value: formatCurrency(averageAcceptedRate),
    },
    {
      label: "CPM",
      value: formatDurationDays(getAverage(payoutDurations)),
    },
    {
      label: "Queued creator payouts",
      value: formatCompactCurrency(payoutReadyTotal),
      helper: `${data.payouts.filter((p) => p.status === "payout_ready").length} awaiting release`,
    },
    {
      label: "Revision request rate",
      value: formatPercent(
        safePercent(revisionRequests, Math.max(data.submissions.length, 1)),
      ),
      helper: `${revisionRequests} revisions requested`,
    },
  ];

  // ── render ──

  const viewConfig = {
    overview: {
      title: "Overview analytics",
      subtitle: "Performance across all creator campaigns",
    },
    ads: {
      title: "Ads analytics",
      subtitle: "How creator content performs on Meta",
    },
    creators: {
      title: "Creator analytics",
      subtitle: "Pipeline health from sourcing through payout",
    },
  } as const;

  const { title, subtitle } = viewConfig[view];

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <AnalyticsPanel className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: "Last 7 days", active: true },
            { label: "All creators", active: false },
            { label: "All products", active: false },
            { label: "All campaigns", active: false },
            { label: "Compare vs previous", active: false },
          ].map((f) => (
            <button
              key={f.label}
              className={cn(
                "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-semibold transition",
                f.active
                  ? "border-[rgba(7,107,210,0.2)] bg-[rgba(7,107,210,0.07)] text-accent"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {f.label}
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0 opacity-50"
              >
                <path
                  d="M2.5 4l2.5 2.5L7.5 4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </AnalyticsPanel>

      {/* KPI strip — overview/creators: 4 cards (1 row); ads: 8 cards (2 rows of 4) */}
      {view === "overview" && <MetricStrip metrics={overviewMetrics} />}
      {view === "ads" && (
        <MetricStrip
          metrics={[
            ...adsMetrics,
            ...financeMetrics.slice(0, 4).map((m) => ({
              label: m.label,
              value: m.value,
            })),
          ]}
        />
      )}
      {view === "creators" && <MetricStrip metrics={creatorMetrics} />}

      {/* Overview layout */}
      {view === "overview" && (
        <>
          <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
            <FunnelPanel
              funnel={analyticsFunnel}
              maxFunnelValue={maxFunnelValue}
            />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <TopContentPanel approvedDeliveries={approvedDeliveries} />
          </div>
        </>
      )}

      {/* Ads layout */}
      {view === "ads" && (
        <div className="space-y-5">
          <PerformanceOverTimePanel />
          <TopCreativesPanel campaignPerformance={campaignPerformance} />
          <BreakdownPanel campaignPerformance={campaignPerformance} />
        </div>
      )}

      {/* Creators layout */}
      {view === "creators" && (
        <CreatorsAnalyticsBoard
          metrics={creatorMetrics}
          funnel={analyticsFunnel}
          maxFunnelValue={maxFunnelValue}
          financeMetrics={financeMetrics}
          campaignPerformance={campaignPerformance}
          topCreators={topCreators}
        />
      )}
    </div>
  );
}
