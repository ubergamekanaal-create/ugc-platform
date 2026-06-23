"use client";

import { useMemo } from "react";
import type { BrandDashboardData } from "@/lib/types";
import type { TimeFilter } from "@/components/dashboard/pipeline-revenue-chart";
type Props = {
  data: BrandDashboardData;
  activeFilter: TimeFilter;
};

type BreakdownCard = {
  id: "campaigns" | "creators" | "products";
  title: string;
  eyebrow: string;
  items: BreakdownItem[];
};

type BreakdownItem = {
  id: string;
  rank: number;
  name: string;
  meta: string;
  amount: number;
  progress: number;
};

type SummaryBucket = {
  id: string;
  name: string;
  amount: number;
  count: number;
  auxValue: number;
  status: string | null;
};

function getDays(filter: TimeFilter) {
  if (filter === "7D") return 7;
  if (filter === "14D") return 14;
  if (filter === "30D") return 30;
  return 90;
}

function getDateValue(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function startOfLocalDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
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

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getCampaignState(status: string | null) {
  if (status === "active" || status === "open") {
    return "live";
  }

  if (status === "in_review") {
    return "review";
  }

  if (status === "completed") {
    return "complete";
  }

  return "tracked";
}

function buildProgressItems(
  buckets: SummaryBucket[],
  metaBuilder: (bucket: SummaryBucket) => string,
  limit: number,
) {
  const topBuckets = buckets
    .sort((left, right) => {
      if (right.amount !== left.amount) {
        return right.amount - left.amount;
      }

      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, limit);

  const maxAmount = Math.max(...topBuckets.map((item) => item.amount), 1);

  return topBuckets.map((bucket, index) => ({
    id: bucket.id,
    rank: index + 1,
    name: bucket.name,
    meta: metaBuilder(bucket),
    amount: bucket.amount,
    progress: Math.max(12, Math.round((bucket.amount / maxAmount) * 100)),
  }));
}

export function BrandTopBreakdownPanel({ data, activeFilter }: Props) {
  
  const cards = useMemo<BreakdownCard[]>(() => {
    const days = getDays(activeFilter);
    const today = startOfLocalDay(new Date());
    const rangeStart = addDays(today, -(days - 1));
    const rangeEnd = addDays(today, 1);
    const campaignsById = new Map(data.campaigns.map((campaign) => [campaign.id, campaign]));

    const campaignBuckets = new Map<string, SummaryBucket>();
    const creatorBuckets = new Map<string, SummaryBucket>();
    const productBuckets = new Map<string, SummaryBucket>();
    const campaignCreatorSets = new Map<string, Set<string>>();
    const creatorPostCounts = new Map<string, number>();
    const productMentionCounts = new Map<string, number>();
    const submissionCreatorMap = new Map(
      data.submissions.map((submission) => [submission.id, submission.creator_id]),
    );
    const submissionCreatorNameMap = new Map(
      data.submissions.map((submission) => [submission.id, submission.creator_name]),
    );
    const submissionProductMap = new Map(
      data.submissions.map((submission) => {
        const campaign = campaignsById.get(submission.campaign_id);
        return [submission.id, campaign?.product_name?.trim() || "Untitled product"] as const;
      }),
    );
    const creatorSubmissionIds = new Map<string, Set<string>>();
    const submissionSpendMap = new Map<string, number>();

    const addCampaignAmount = (
      campaignId: string,
      amount: number,
      count = 0,
      auxValue = 0,
    ) => {
      const campaign = campaignsById.get(campaignId);
      if (!campaign) return;

      const existing = campaignBuckets.get(campaignId) ?? {
        id: campaignId,
        name: campaign.title,
        amount: 0,
        count: 0,
        auxValue: 0,
        status: campaign.status,
      };

      existing.amount += amount;
      existing.count += count;
      existing.auxValue += auxValue;
      existing.status = campaign.status;
      campaignBuckets.set(campaignId, existing);
    };

    const addCreatorAmount = (
      creatorId: string,
      creatorName: string,
      amount: number,
      count = 1,
      auxValue = 0,
    ) => {
      const existing = creatorBuckets.get(creatorId) ?? {
        id: creatorId,
        name: `@${creatorName.toLowerCase().replace(/\s+/g, "")}`,
        amount: 0,
        count: 0,
        auxValue: 0,
        status: null,
      };

      existing.amount += amount;
      existing.count += count;
      existing.auxValue += auxValue;
      creatorBuckets.set(creatorId, existing);
    };

    const addProductAmount = (
      productName: string,
      amount: number,
      count = 0,
      auxValue = 0,
    ) => {
      const key = productName.trim().toLowerCase();
      if (!key) return;

      const existing = productBuckets.get(key) ?? {
        id: key,
        name: productName,
        amount: 0,
        count: 0,
        auxValue: 0,
        status: null,
      };

      existing.amount += amount;
      existing.count += count;
      existing.auxValue += auxValue;
      productBuckets.set(key, existing);
    };

    const bumpCount = (map: Map<string, number>, key: string, amount = 1) => {
      map.set(key, (map.get(key) ?? 0) + amount);
    };

    const addCampaignCreator = (campaignId: string, creatorId: string) => {
      const existing = campaignCreatorSets.get(campaignId) ?? new Set<string>();
      existing.add(creatorId);
      campaignCreatorSets.set(campaignId, existing);
    };

    const addCreatorSubmissionId = (creatorId: string, submissionId: string) => {
      const existing = creatorSubmissionIds.get(creatorId) ?? new Set<string>();
      existing.add(submissionId);
      creatorSubmissionIds.set(creatorId, existing);
    };

    data.submissions.forEach((submission) => {
      const inRange = isWithinRange(
        submission.reviewed_at ?? submission.submitted_at ?? submission.created_at,
        rangeStart,
        rangeEnd,
      );
      if (!inRange || submission.status !== "approved") return;

      const campaign = campaignsById.get(submission.campaign_id);

      addCampaignAmount(submission.campaign_id, submission.rate);
      addCampaignCreator(submission.campaign_id, submission.creator_id);
    });

    data.applications.forEach((application) => {
      if (!isWithinRange(application.created_at, rangeStart, rangeEnd)) return;
      if (application.status !== "accepted" && application.status !== "shortlisted") return;

      addCampaignAmount(application.campaign_id, 0);
      addCampaignCreator(application.campaign_id, application.creator_id);
    });

    data.payouts.forEach((payout) => {
      if (payout.status !== "paid" && payout.status !== "payout_ready") {
        return;
      }

      submissionSpendMap.set(
        payout.submission_id,
        (submissionSpendMap.get(payout.submission_id) ?? 0) + payout.creator_amount,
      );
    });

    (data.attributed_orders ?? []).forEach((order) => {
      const orderDate = order.ordered_at ?? order.created_at;
      if (!isWithinRange(orderDate, rangeStart, rangeEnd)) return;
      if (!order.submission_id) return;

      const creatorId = submissionCreatorMap.get(order.submission_id);
      const creatorName = submissionCreatorNameMap.get(order.submission_id);
      if (!creatorId || !creatorName) return;

      const productName = submissionProductMap.get(order.submission_id) ?? "Untitled product";
      addCreatorAmount(creatorId, creatorName, order.total ?? 0, 0, 0);
      addCreatorSubmissionId(creatorId, order.submission_id);
      addProductAmount(productName, order.total ?? 0, 0, 0);
    });

    campaignBuckets.forEach((bucket, campaignId) => {
      bucket.count = campaignCreatorSets.get(campaignId)?.size ?? 0;
    });

    creatorBuckets.forEach((bucket, creatorId) => {
      const submissionIds = Array.from(creatorSubmissionIds.get(creatorId) ?? []);
      bucket.count = submissionIds.length;
      bucket.auxValue = submissionIds.reduce(
        (sum, submissionId) => sum + (submissionSpendMap.get(submissionId) ?? 0),
        0,
      );

      submissionIds.forEach((submissionId) => {
        const productName = submissionProductMap.get(submissionId);
        if (!productName) return;

        bumpCount(productMentionCounts, productName.trim().toLowerCase());
      });
    });

    productBuckets.forEach((bucket, productId) => {
      bucket.count = productMentionCounts.get(productId) ?? 0;
    });

    return [
      {
        id: "campaigns",
        title: "Top campaigns",
        eyebrow: `${activeFilter} · by pipeline`,
        items: buildProgressItems(
          Array.from(campaignBuckets.values()),
          (bucket) => `${formatCount(bucket.count, "creator")} · ${getCampaignState(bucket.status)}`,
          3,
        ),
      },
      {
        id: "creators",
        title: "Top creators",
        eyebrow: `${activeFilter} · GMV-weighted`,
        items: buildProgressItems(
          Array.from(creatorBuckets.values()).filter((bucket) => bucket.amount > 0),
          (bucket) => {
            const roas = bucket.auxValue > 0 ? bucket.amount / bucket.auxValue : 0;
            return `${formatCount(bucket.count, "post")} · ROAS ${roas.toFixed(1)}x`;
          },
          5,
        ),
      },
      {
        id: "products",
        title: "Top products",
        eyebrow: `${activeFilter} · creator-driven`,
        items: buildProgressItems(
          Array.from(productBuckets.values()).filter((bucket) => bucket.amount > 0),
          (bucket) => `${formatCount(bucket.count, "mention")}`,
          3,
        ),
      },
    ];
  }, [activeFilter, data]);

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {cards.map((card) => (
        <section
          key={card.id}
          className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_14px_44px_rgba(15,23,42,0.05)] sm:px-6 sm:py-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[1.2rem] font-semibold tracking-tight text-slate-950">
              {card.title}
            </h3>
            <p className="text-[0.78rem] font-medium text-slate-400">{card.eyebrow}</p>
          </div>

          <div className="mt-6 space-y-5">
            {card.items.length ? (
              card.items.map((item, index) => (
                <div
                  key={item.id}
                  className={index > 0 ? "border-t border-slate-100 pt-5" : ""}
                >
                  <div className="grid grid-cols-[14px_minmax(0,1fr)_auto] items-end gap-3">
                    <span className="text-[0.74rem] font-medium text-slate-400">
                      {item.rank}
                    </span>
                    <p className="truncate text-[1rem] font-medium tracking-[-0.02em] text-slate-950">
                      {item.name}
                    </p>
                    <span className="text-[1rem] font-semibold tracking-[-0.03em] text-slate-950">
                      {formatAmount(item.amount)}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-3">
                    <span />
                    <div className="h-[4px] overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#2D5BFF]"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span />
                  </div>

                  <div className="mt-2 grid grid-cols-[14px_minmax(0,1fr)] gap-3">
                    <span />
                    <p className="truncate text-[0.78rem] text-slate-400">{item.meta}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-400">
                No ranked activity for {activeFilter.toLowerCase()} yet.
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
