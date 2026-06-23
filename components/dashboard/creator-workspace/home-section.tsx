"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CreatorInvitationsPanel } from "@/components/dashboard/creator-invitations-panel";
import { CreatorSubmissionsPanel } from "@/components/dashboard/creator-submissions-panel";
import { HoverLift, MotionScale } from "@/components/shared/motion";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { getStatusClasses } from "./helpers";
import { SectionPanel } from "./section-panel";
import type { CreatorWorkspaceSectionContext } from "./types";

type EarningsRange = 7 | 30 | 90;

function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getEarningsDate(value: string | null) {
  return value ? getStartOfDay(new Date(value)) : null;
}

function formatChartDate(date: Date, range: EarningsRange) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(range === 90 ? { year: "2-digit" as const } : {}),
  }).format(date);
}

function getDaysUntilDeadline(deadline: string | null) {
  if (!deadline) return null;

  const today = getStartOfDay(new Date());
  const deadlineDate = getStartOfDay(new Date(deadline));
  const days = Math.ceil(
    (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  return days >= 0 ? days : null;
}

function getShortDescription(value: string) {
  return value.length > 130 ? `${value.slice(0, 127).trim()}...` : value;
}

export function CreatorWorkspaceHomeSection({ ctx }: { ctx: CreatorWorkspaceSectionContext }) {
  const {
    data,
    pendingInvitations,
    acceptedApplications,
    acceptedValue,
    searchQuery,
    setSearchQuery,
    filteredCampaigns,
    drafts,
    expandedCampaignId,
    setExpandedCampaignId,
    setDrafts,
    pendingCampaignId,
    handleApply,
    feedback,
    isRefreshing,
  } = ctx;
  const [earningsRange, setEarningsRange] = useState<EarningsRange>(30);
  const earnings = useMemo(() => {
    const today = getStartOfDay(new Date());
    const rangeStart = new Date(today);
    const previousRangeStart = new Date(today);
    const currentRangeEnd = new Date(today);

    rangeStart.setDate(today.getDate() - earningsRange + 1);
    previousRangeStart.setDate(rangeStart.getDate() - earningsRange);
    currentRangeEnd.setDate(today.getDate() + 1);

    const paidPayouts = data.payouts.filter((payout) => payout.status === "paid");
    const currentPayouts = paidPayouts.filter((payout) => {
      const paidAt = getEarningsDate(payout.paid_at);
      return paidAt && paidAt >= rangeStart && paidAt < currentRangeEnd;
    });
    const previousPayouts = paidPayouts.filter((payout) => {
      const paidAt = getEarningsDate(payout.paid_at);
      return paidAt && paidAt >= previousRangeStart && paidAt < rangeStart;
    });
    const currentTotal = currentPayouts.reduce(
      (sum, payout) => sum + payout.creator_amount,
      0,
    );
    const previousTotal = previousPayouts.reduce(
      (sum, payout) => sum + payout.creator_amount,
      0,
    );
    const dailyTotals = new Map<string, number>();

    currentPayouts.forEach((payout) => {
      const paidAt = getEarningsDate(payout.paid_at);

      if (!paidAt) return;

      const key = paidAt.toISOString();
      dailyTotals.set(key, (dailyTotals.get(key) ?? 0) + payout.creator_amount);
    });

    const chartData = Array.from({ length: earningsRange }, (_, index) => {
      const date = new Date(rangeStart);
      date.setDate(rangeStart.getDate() + index);

      return {
        date: formatChartDate(date, earningsRange),
        value: dailyTotals.get(date.toISOString()) ?? 0,
      };
    });
    const change =
      previousTotal > 0
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : currentTotal > 0
          ? 100
          : 0;

    return { chartData, currentTotal, change };
  }, [data.payouts, earningsRange]);
  const readyPayoutTotal = data.payouts
    .filter((payout) => payout.status === "payout_ready")
    .reduce((sum, payout) => sum + payout.creator_amount, 0);
  const awaitingReview = data.applications.filter(
    (application) => application.status === "pending",
  ).length;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {/* <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Zone 1 <span className="mx-1 text-slate-300">-</span> Your money & momentum
          </p> */}
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <SectionPanel className="overflow-hidden p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total earnings - last {earningsRange} days
                </p>
                <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-950">
                  {formatCurrency(earnings.currentTotal)}
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm font-medium",
                    earnings.change >= 0 ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {earnings.change >= 0 ? "+" : ""}
                  {earnings.change.toFixed(0)}% from previous period
                </p>
              </div>
              <div className="inline-flex self-start rounded-full border border-slate-200 bg-slate-50 p-1">
                {([7, 30, 90] as EarningsRange[]).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setEarningsRange(range)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition",
                      earningsRange === range
                        ? "bg-accent text-white shadow-[0_6px_16px_rgba(7,107,210,0.18)]"
                        : "text-slate-500 hover:text-accent",
                    )}
                  >
                    {range}D
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 h-44 rounded-2xl border border-slate-100 bg-slate-50/80 px-2 py-3">
              {earnings.currentTotal > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earnings.chartData}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(typeof value === "number" ? value : 0)
                      }
                      contentStyle={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#076BD2"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5, fill: "#076BD2", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
                  No data
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-500">
                Ready for payout:{" "}
                <span className="font-semibold text-slate-950">
                  {formatCurrency(readyPayoutTotal)}
                </span>
              </p>
              <Link href="/dashboard/payouts" className="font-semibold text-accent transition hover:text-blue-600">
                View payouts
              </Link>
            </div>
          </SectionPanel>

          <SectionPanel className="p-5">
            <p className="text-sm font-medium text-slate-500">Your pipeline</p>
            <div className="mt-5 space-y-4">
              {[
                { label: "Applications sent", value: data.applications.length, tone: "bg-accent" },
                { label: "Awaiting review", value: awaitingReview, tone: "bg-amber-400" },
                { label: "Active briefs", value: acceptedApplications.length, tone: "bg-emerald-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className={cn("h-2 w-2 rounded-full", item.tone)} />
                    {item.label}
                  </span>
                  <span className="font-semibold text-slate-950">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-500">Accepted pipeline value</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {formatCurrency(acceptedValue || 0)}
              </p>
            </div>
          </SectionPanel>
        </div>
      </div>

      {data.invitations.length ? (
        <SectionPanel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[1.2rem] font-semibold tracking-tight text-slate-950">
                Brand Invitations
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Review direct offers from brands and accept or decline them.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-accent">
              {pendingInvitations.length} pending
            </span>
          </div>
          <div className="mt-8">
            <CreatorInvitationsPanel invitations={data.invitations} />
          </div>
        </SectionPanel>
      ) : null}

      {acceptedApplications.length ? (
        <SectionPanel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[1.2rem] font-semibold tracking-tight text-slate-950">
                Active Deliveries
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Submit accepted campaign work and respond to revision requests.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              {acceptedApplications.length} accepted
            </span>
          </div>
          <div className="mt-8">
            <CreatorSubmissionsPanel
              opportunities={acceptedApplications}
              submissions={data.submissions}
            />
          </div>
        </SectionPanel>
      ) : null}

      <SectionPanel className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[1.2rem] font-semibold tracking-tight text-slate-950">
                Discover briefs
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {new Set(data.campaigns.map((campaign) => campaign.brand_name)).size} brands looking for creators like you
            </p>
          </div>
          <label className="relative w-full sm:max-w-[170px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35m1.1-5.4a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                />
              </svg>
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search"
              className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </label>
        </div>

        {/* <div className="mt-4 flex flex-wrap gap-2">
          {["For you", "All briefs", "UGC video", "Instagram", "$100+"].map(
            (filter, index) => (
              <span
                key={filter}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                  index === 0
                    ? "border-accent bg-accent text-white shadow-[0_8px_18px_rgba(7,107,210,0.16)]"
                    : "border-slate-200 bg-white text-slate-600",
                )}
              >
                {filter}
              </span>
            ),
          )}
        </div> */}

        <div
          className={`mt-5 grid gap-4 ${filteredCampaigns.length > 0 ? "xl:grid-cols-2" : ""
            }`}
        >
          {filteredCampaigns.length ? (
            filteredCampaigns.map((campaign) => {
              const draft = drafts[campaign.id] ?? { pitch: "", rate: "" };
              const isExpanded = expandedCampaignId === campaign.id;
              const daysLeft = getDaysUntilDeadline(campaign.deadline);

              return (
                <HoverLift
                  key={campaign.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_14px_32px_rgba(15,23,42,0.05)] sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold uppercase text-accent">
                      {getInitials(campaign.brand_name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="capitalize text-[1rem] font-semibold leading-5 text-slate-950 sm:truncate">
                            {campaign.title}
                          </h3>
                          <p className="mt-1 text-xs font-medium leading-5 text-accent sm:truncate">
                            {campaign.brand_name}
                            {campaign.brand_headline ? ` - ${campaign.brand_headline}` : ""}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "w-fit shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            campaign.has_applied
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-[rgba(7,107,210,0.08)] text-accent",
                          )}
                        >
                          {campaign.has_applied ? "Applied" : "For you"}
                        </span>
                      </div>

                      <p className="mt-3 text-xs font-medium text-slate-600">
                        {getShortDescription(campaign.description)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {[campaign.content_type, ...campaign.platforms.slice(0, 2)].map(
                          (item) => (
                            <span
                              key={item}
                              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-[0_6px_16px_rgba(15,23,42,0.04)]"
                            >
                              {item}
                            </span>
                          ),
                        )}
                        {daysLeft !== null ? (
                          <span className="rounded-full bg-[rgba(7,107,210,0.08)] px-2.5 py-1 text-[11px] font-semibold text-accent">
                            {daysLeft === 0 ? "Due today" : `${daysLeft} days left`}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-slate-950">
                            {formatCurrency(campaign.budget)}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                            {campaign.payment_type}
                          </p>
                        </div>
                        {campaign.has_applied ? (
                          <span className="w-fit rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                            In review
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCampaignId((current) =>
                                current === campaign.id ? null : campaign.id,
                              )
                            }
                            className="w-full rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(7,107,210,0.18)] transition hover:shadow-[0_14px_28px_rgba(7,107,210,0.24)] sm:w-auto"
                          >
                            {isExpanded ? "Hide application" : "Apply now"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && !campaign.has_applied ? (
                    <div className="mt-4 grid gap-4 rounded-[1.25rem] border border-slate-200 bg-white p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Deliverables
                          </p>
                          <p className="mt-2 font-semibold text-slate-950">
                            {campaign.deliverables}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Creator requirements
                          </p>
                          <p className="mt-2 font-semibold text-slate-950">
                            {campaign.creator_requirements || "Open brief"}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Usage rights
                          </p>
                          <p className="mt-2 font-semibold text-slate-950">
                            {campaign.usage_rights || "To be confirmed"}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Product details
                          </p>
                          <p className="mt-2 font-semibold text-slate-950">
                            {campaign.product_details || "Shared after selection"}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                        <div>
                          <label
                            htmlFor={`pitch-${campaign.id}`}
                            className="mb-2 block text-sm font-medium text-slate-600"
                          >
                            Pitch
                          </label>
                          <textarea
                            id={`pitch-${campaign.id}`}
                            rows={4}
                            value={draft.pitch}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [campaign.id]: {
                                  ...current[campaign.id],
                                  pitch: event.target.value,
                                  rate: current[campaign.id]?.rate ?? "",
                                },
                              }))
                            }
                            placeholder="Explain why you are a strong fit for this brief."
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                          />
                        </div>
                        <div className="flex flex-col justify-between gap-4">
                          <div>
                            <label
                              htmlFor={`rate-${campaign.id}`}
                              className="mb-2 block text-sm font-medium text-slate-600"
                            >
                              Your rate
                            </label>
                            <input
                              id={`rate-${campaign.id}`}
                              type="number"
                              min="0"
                              value={draft.rate}
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [campaign.id]: {
                                    ...current[campaign.id],
                                    pitch: current[campaign.id]?.pitch ?? "",
                                    rate: event.target.value,
                                  },
                                }))
                              }
                              placeholder="900"
                              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                            />
                          </div>
                          <MotionScale
                            type="button"
                            disabled={pendingCampaignId === campaign.id}
                            onClick={() => handleApply(campaign.id)}
                            className="rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {pendingCampaignId === campaign.id
                              ? "Submitting..."
                              : "Send application"}
                          </MotionScale>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </HoverLift>
              );
            })
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
              No campaigns match your search right now.
            </div>
          )}
          {feedback ? <p className="text-sm text-slate-500">{feedback}</p> : null}
        </div>
      </SectionPanel>

      <SectionPanel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[1.2rem] font-semibold tracking-tight text-slate-950">
              Recent Applications
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Track the status of every pitch you have sent.
            </p>
          </div>
        </div>
        <div className="mt-8 space-y-4">
          {data.applications.length ? (
            data.applications.map((application) => (
              <div
                key={application.id}
                className="rounded-[1.5rem] border border-slate-200 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-[1rem] font-semibold text-slate-950">
                      {application.campaign_title}
                    </h3>
                    <p className="mt-2 text-sm text-accent">
                      {application.brand_name}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      getStatusClasses(application.status),
                    )}
                  >
                    {application.status}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {application.pitch}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>{formatCurrency(application.rate)}</span>
                  <span>{formatDate(application.created_at)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
              Your submitted applications will appear here.
            </div>
          )}
          {isRefreshing ? (
            <p className="text-sm text-slate-500">Refreshing dashboard...</p>
          ) : null}
        </div>
      </SectionPanel>
    </div>
  );
}
