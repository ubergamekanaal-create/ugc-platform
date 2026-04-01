"use client";

import Link from "next/link";
import {
  type JSX,
  type ReactNode,
  useMemo,
} from "react";
import { BrandCreatorsHub } from "@/components/dashboard/brand-creators-hub";
import { BrandFinancePanel } from "@/components/dashboard/brand-finance-panel";
import { BrandIntegrationsPanel } from "@/components/dashboard/brand-integrations-panel";
import { BrandMetaPanel } from "@/components/dashboard/brand-meta-panel";
import { BrandSubmissionsPanel } from "@/components/dashboard/brand-submissions-panel";
import { NotificationsCenter } from "@/components/dashboard/notifications-center";
import { RealtimeChatPanel } from "@/components/dashboard/realtime-chat-panel";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import {
  WorkspaceMainContent,
  WorkspacePanel,
  WorkspaceSidebar,
  WorkspaceShell,
  WorkspaceViewport,
  type WorkspaceNavGroup,
} from "@/components/dashboard/workspace-shell";
import {
  FadeIn,
  HoverLift,
} from "@/components/shared/motion";
import { buildBrandChatCandidates } from "@/lib/chat/candidates";
import {
  brandWorkspaceSections,
  getBrandWorkspaceHref,
  type BrandWorkspaceSection,
} from "@/lib/brand-workspace";
import type {
  BrandDashboardData,
  CampaignStatus,
  UserProfile,
} from "@/lib/types";
import {
  cn,
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatPercent,
  getDisplayName,
  getInitials,
} from "@/lib/utils";

type BrandWorkspaceProps = {
  profile: UserProfile & { role: "brand" };
  data: BrandDashboardData;
  section: BrandWorkspaceSection;
  renderMode?: "full" | "content";
  detailView?: {
    title: string;
    description: string;
    content: ReactNode;
    metaItems?: Array<{ label: string; value: string }>;
    banner?: ReactNode;
  };
};

type BrandWorkspaceChromeProps = {
  profile: UserProfile & { role: "brand" };
  data: BrandDashboardData;
  section: BrandWorkspaceSection;
  children: ReactNode;
};

type CreatorSpotlight = {
  id: string;
  name: string;
  headline: string | null;
  applications: number;
  accepted: number;
  rate: number;
  campaignTitle: string;
  focus: string;
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

type IconProps = {
  className?: string;
};

const sectionIcons: Record<
  BrandWorkspaceSection,
  (props: IconProps) => JSX.Element
> = {
  dashboard: DashboardIcon,
  submissions: SubmissionIcon,
  chat: ChatIcon,
  ads: AdsIcon,
  analytics: AnalyticsIcon,
  creators: CreatorsIcon,
  finance: FinanceIcon,
  integrations: IntegrationsIcon,
  settings: SettingsIcon,
};

function buildCreatorRoster(data: BrandDashboardData) {
  return data.creators
    .map(
      (creator): CreatorSpotlight => ({
        id: creator.id,
        name: creator.name,
        headline: creator.headline,
        applications: creator.applications,
        accepted: creator.accepted,
        rate: Math.max(creator.base_rate, creator.rate),
        campaignTitle: creator.latest_campaign_title ?? creator.focus,
        focus: creator.niches[0] ?? creator.focus,
      }),
    )
    .sort((left, right) => {
      const scoreDelta =
        right.accepted * 3 +
        right.applications -
        (left.accepted * 3 + left.applications);

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return right.rate - left.rate;
    });
}

function clampPercent(value: number) {
  return Math.max(8, Math.min(100, Math.round(value)));
}

function safePercent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return (numerator / denominator) * 100;
}

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

function startOfLocalDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfLocalDay(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

function formatShortDateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
}

function formatDurationDays(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0d";
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)}d`;
}

function getStatusClasses(status: string) {
  if (status === "accepted") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "shortlisted") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "revision_requested") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "active") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "submitted") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "connected") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected" || status === "declined") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-slate-100 text-slate-600";
}

function DashboardIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M4 13.5 12 5l8 8.5" />
      <path d="M6.5 11.5V20h11V11.5" />
    </svg>
  );
}

function SubmissionIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <rect x="4" y="5" width="16" height="14" rx="4" />
      <path d="M8 11h8M8 15h5" />
    </svg>
  );
}

function ChatIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M8 18 4 20v-4.5A8 8 0 1 1 12 20h-1" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function AdsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M4 12h4l8-4v8l-8-4H4Z" />
      <path d="M16 10.5a4 4 0 0 1 0 3" />
      <path d="M18 8a7 7 0 0 1 0 8" />
    </svg>
  );
}

function AnalyticsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
      <path d="M4 19h16" />
    </svg>
  );
}

function CreatorsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M4 19a5 5 0 0 1 10 0" />
      <path d="M14.5 19a4 4 0 0 1 5.5-3.7" />
    </svg>
  );
}

function FinanceIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M12 4v16" />
      <path d="M16 7.5c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 3 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" />
    </svg>
  );
}

function IntegrationsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M7 6h10" />
      <path d="M7 18h10" />
      <path d="M9 4v4" />
      <path d="M15 16v4" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SettingsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="12" cy="12" r="3.5" />
      <path d="m19 12 1.7-1-1.5-2.6-2 .4a6.8 6.8 0 0 0-1.5-.9L15 5.8h-3l-.7 2.1c-.5.2-1 .5-1.5.9l-2-.4L6.3 11 8 12l-.2 1.2-1.5 1.8 2.1 2.1 1.8-1.5 1.2.2 1 1.7h3l1-1.7 1.2-.2 1.8 1.5 2.1-2.1-1.5-1.8Z" />
    </svg>
  );
}

function SparkIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m12 3 1.7 4.8L18.5 9l-4.8 1.7L12 15.5l-1.7-4.8L5.5 9l4.8-1.2Z" />
    </svg>
  );
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  );
}

function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

function SectionPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <WorkspacePanel className={className}>{children}</WorkspacePanel>;
}

export function BrandWorkspace({
  profile,
  data,
  section,
  renderMode = "full",
  detailView,
}: BrandWorkspaceProps) {
  const activeSection =
    brandWorkspaceSections.find((item) => item.slug === section) ??
    brandWorkspaceSections[0];
  const displayName = getDisplayName(profile.company_name, "CIRCL Brand");
  const welcomeName = getDisplayName(
    profile.full_name || profile.company_name,
    "team",
  );
  const totalBudget = data.campaigns.reduce(
    (sum, campaign) => sum + campaign.budget,
    0,
  );
  const activeCampaigns = data.campaigns.filter(
    (campaign) => campaign.status === "open" || campaign.status === "active",
  );
  const pendingReviews = data.applications.filter(
    (application) => application.status === "pending",
  ).length;
  const pendingSubmissionReviews = data.submissions.filter(
    (submission) => submission.status === "submitted",
  ).length;
  const revisionRequests = data.submissions.filter(
    (submission) => submission.status === "revision_requested",
  ).length;
  const approvedSubmissionValue = data.submissions
    .filter((submission) => submission.status === "approved")
    .reduce((sum, submission) => sum + submission.rate, 0);
  const shortlisted = data.applications.filter(
    (application) => application.status === "shortlisted",
  ).length;
  const acceptedCount = data.applications.filter(
    (application) => application.status === "accepted",
  ).length;
  const acceptedValue = data.applications
    .filter((application) => application.status === "accepted")
    .reduce((sum, application) => sum + application.rate, 0);
  const paidFundingTotal = data.fundings
    .filter((funding) => funding.status === "paid")
    .reduce((sum, funding) => sum + funding.amount, 0);
  const totalPayoutsGross = data.payouts.reduce(
    (sum, payout) => sum + payout.amount,
    0,
  );
  const paidPayoutCount = data.payouts.filter((payout) => payout.status === "paid").length;
  const paidPayoutTotal = data.payouts
    .filter((payout) => payout.status === "paid")
    .reduce((sum, payout) => sum + payout.creator_amount, 0);
  const payoutReadyTotal = data.payouts
    .filter((payout) => payout.status === "payout_ready")
    .reduce((sum, payout) => sum + payout.creator_amount, 0);
  const totalCreatorSlots = data.campaigns.reduce(
    (sum, campaign) => sum + campaign.creator_slots,
    0,
  );
  const approvedSubmissions = data.submissions.filter(
    (submission) => submission.status === "approved",
  );
  const submissionApprovalRate = safePercent(
    approvedSubmissions.length,
    data.submissions.length,
  );
  const creatorConversionRate = safePercent(acceptedCount, data.applications.length);
  const slotFillRate = safePercent(acceptedCount, totalCreatorSlots);
  const payoutReleaseRate = safePercent(paidPayoutCount, data.payouts.length);
  const fundingCoverageRate = safePercent(paidFundingTotal, totalBudget);
  const budgetCommittedRate = safePercent(totalPayoutsGross, totalBudget);
  const averageAcceptedRate = acceptedCount
    ? acceptedValue / acceptedCount
    : data.applications.length
      ? data.applications.reduce((sum, application) => sum + application.rate, 0) /
        data.applications.length
      : 0;
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
  const campaignPerformance = useMemo<CampaignPerformanceSummary[]>(
    () =>
      data.campaigns
        .map((campaign) => {
          const applications = data.applications.filter(
            (application) => application.campaign_id === campaign.id,
          );
          const submissions = data.submissions.filter(
            (submission) => submission.campaign_id === campaign.id,
          );
          const payouts = data.payouts.filter(
            (payout) => payout.campaign_id === campaign.id,
          );
          const fundings = data.fundings.filter(
            (funding) => funding.campaign_id === campaign.id && funding.status === "paid",
          );
          const accepted = applications.filter(
            (application) => application.status === "accepted",
          ).length;
          const approved = submissions.filter(
            (submission) => submission.status === "approved",
          ).length;
          const applicationRates = applications.map((application) => application.rate);

          return {
            id: campaign.id,
            title: campaign.title,
            status: campaign.status,
            budget: campaign.budget,
            creatorSlots: campaign.creator_slots,
            applications: applications.length,
            shortlisted: applications.filter(
              (application) => application.status === "shortlisted",
            ).length,
            accepted,
            submissions: submissions.length,
            approved,
            revisionRequested: submissions.filter(
              (submission) => submission.status === "revision_requested",
            ).length,
            funded: fundings.reduce((sum, funding) => sum + funding.amount, 0),
            paidOut: payouts
              .filter((payout) => payout.status === "paid")
              .reduce((sum, payout) => sum + payout.creator_amount, 0),
            averageRate: applicationRates.length ? getAverage(applicationRates) : 0,
            slotFillRate: safePercent(accepted, campaign.creator_slots),
            approvalRate: safePercent(approved, Math.max(submissions.length, accepted)),
          };
        })
        .sort((left, right) => {
          const performanceDelta =
            right.approved * 5 +
            right.accepted * 3 +
            right.applications -
            (left.approved * 5 + left.accepted * 3 + left.applications);

          if (performanceDelta !== 0) {
            return performanceDelta;
          }

          return right.budget - left.budget;
        }),
    [data.applications, data.campaigns, data.fundings, data.payouts, data.submissions],
  );
  const analyticsFunnel = useMemo(
    () => [
      {
        label: "Creator slots opened",
        value: totalCreatorSlots,
        meta: `${data.campaigns.length} live briefs`,
      },
      {
        label: "Applications received",
        value: data.applications.length,
        meta: `${formatPercent(
          safePercent(data.applications.length, Math.max(totalCreatorSlots, 1)),
        )} demand per slot`,
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
    ],
    [
      acceptedCount,
      data.applications.length,
      data.campaigns.length,
      approvedSubmissions.length,
      paidPayoutCount,
      payoutReleaseRate,
      slotFillRate,
      submissionApprovalRate,
      totalCreatorSlots,
    ],
  );
  const maxFunnelValue = useMemo(
    () => Math.max(...analyticsFunnel.map((item) => item.value), 1),
    [analyticsFunnel],
  );
  const approvedDeliveries = useMemo(
    () =>
      approvedSubmissions
        .slice()
        .sort((left, right) => {
          const rightReviewedAt = getDateValue(right.reviewed_at) ?? 0;
          const leftReviewedAt = getDateValue(left.reviewed_at) ?? 0;
          return rightReviewedAt - leftReviewedAt;
        })
        .slice(0, 5),
    [approvedSubmissions],
  );
  const creatorRoster = useMemo(() => buildCreatorRoster(data), [data]);
  const chatCandidates = useMemo(() => buildBrandChatCandidates(data), [data]);
  const topCreators = creatorRoster.slice(0, 4);
  const primaryStats = [
    {
      label: "Live campaigns",
      value: String(activeCampaigns.length),
    },
    {
      label: "Submissions",
      value: String(data.applications.length),
    },
    {
      label: "Committed spend",
      value: formatCompactCurrency(totalBudget || 0),
    },
  ];
  const pendingInvitationCount = data.invitations.filter(
    (invitation) => invitation.status === "pending",
  ).length;
  const hasWorkspaceActivity =
    data.campaigns.length > 0 ||
    data.applications.length > 0 ||
    data.submissions.length > 0 ||
    data.fundings.length > 0 ||
    data.payouts.length > 0;
  const onboardingSteps = [
    {
      label: "Connect your store",
      complete: Boolean(profile.company_name),
    },
    {
      label: "Connect Meta",
      complete: activeCampaigns.length > 0,
    },
    {
      label: "Create your first program",
      complete: data.campaigns.length > 0,
    },
    {
      label: "Invite creators",
      complete: data.applications.length > 0,
    },
  ];
  const completedSteps = onboardingSteps.filter((step) => step.complete).length;
  const pipelineSnapshot = [
    {
      label: "Applications to review",
      value: String(pendingReviews),
      hint: pendingReviews
        ? "Shortlist or accept creators"
        : "Queue is clear",
      tone: "bg-[rgba(7,107,210,0.08)] text-accent",
    },
    {
      label: "Deliveries to review",
      value: String(pendingSubmissionReviews),
      hint: pendingSubmissionReviews
        ? "New creator submissions waiting"
        : "No delivery backlog",
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Open revisions",
      value: String(revisionRequests),
      hint: revisionRequests
        ? "Creators still iterating"
        : "No active revision cycles",
      tone: "bg-slate-100 text-slate-700",
    },
    {
      label: "Payouts ready",
      value: formatCompactCurrency(payoutReadyTotal || 0),
      hint: payoutReadyTotal > 0 ? "Ready to release" : "Nothing queued",
      tone: "bg-emerald-50 text-emerald-700",
    },
  ];
  const recentPayoutActivity = useMemo(() => {
    const today = startOfLocalDay(new Date());
    const buckets = Array.from({ length: 4 }, (_, index) => {
      const end = addDays(today, -(3 - index) * 7);
      const start = addDays(end, -6);

      return {
        label: formatShortDateLabel(start),
        start,
        end: endOfLocalDay(end),
        value: 0,
      };
    });

    let committedTotal = 0;
    let releasedTotal = 0;

    data.payouts.forEach((payout) => {
      const payoutTimestamp =
        getDateValue(payout.paid_at) ?? getDateValue(payout.created_at);

      if (!payoutTimestamp) {
        return;
      }

      const bucket = buckets.find(
        (item) =>
          payoutTimestamp >= item.start.getTime() &&
          payoutTimestamp <= item.end.getTime(),
      );

      if (!bucket) {
        return;
      }

      bucket.value += payout.creator_amount;
      committedTotal += payout.creator_amount;

      if (payout.status === "paid") {
        releasedTotal += payout.creator_amount;
      }
    });

    return {
      buckets: buckets.map((bucket) => ({
        label: bucket.label,
        value: bucket.value,
      })),
      committedTotal,
      releasedTotal,
      maxValue: Math.max(...buckets.map((bucket) => bucket.value), 0),
    };
  }, [data.payouts]);
  const campaignMomentum = campaignPerformance.slice(0, 4);

  function renderDashboardSection() {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
          <FadeIn>
            <SectionPanel className="h-full">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-accent">
                    <SparkIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                      {hasWorkspaceActivity ? "Live Pipeline" : "Getting Started"}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {hasWorkspaceActivity
                        ? "Real workload across reviews, payouts, and live creator ops."
                        : "Launch the core pieces of your brand workspace."}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500">
                  {hasWorkspaceActivity
                    ? `${activeCampaigns.length} live campaigns`
                    : `${completedSteps}/${onboardingSteps.length}`}
                </span>
              </div>
              {hasWorkspaceActivity ? (
                <>
                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {pipelineSnapshot.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[1.5rem] border border-slate-200 bg-white p-4"
                      >
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
                            item.tone,
                          )}
                        >
                          {item.label}
                        </span>
                        <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                          {item.value}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                          {item.hint}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/dashboard/submissions"
                      className="inline-flex h-10 items-center justify-center rounded-full bg-[color:#076BD2] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(7,107,210,0.18)] transition hover:bg-[#0559AE]"
                    >
                      Open submissions
                    </Link>
                    <Link
                      href="/dashboard/finance"
                      className="inline-flex h-10 items-center justify-center rounded-full border border-accent/15 bg-[rgba(7,107,210,0.06)] px-4 text-sm font-semibold text-accent transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.1)]"
                    >
                      Open finance
                    </Link>
                    <span className="inline-flex h-10 items-center justify-center rounded-full bg-slate-100 px-4 text-sm font-medium text-slate-500">
                      {pendingInvitationCount} pending invites
                    </span>
                  </div>
                </>
              ) : (
                <div className="mt-8 space-y-4">
                  {onboardingSteps.map((step) => (
                    <div
                      key={step.label}
                      className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 px-4 py-4"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold",
                            step.complete
                              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                              : "border-slate-300 bg-white text-slate-400",
                          )}
                        >
                          {step.complete ? (
                            <CheckIcon className="h-4 w-4" />
                          ) : (
                            <span> </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-lg font-medium",
                            step.complete
                              ? "text-slate-400 line-through"
                              : "text-slate-900",
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                      <ArrowUpRightIcon className="h-5 w-5 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </SectionPanel>
          </FadeIn>

          <FadeIn delay={0.08}>
            <SectionPanel className="h-full">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                    Creator Earnings
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Real payout activity from the last four weekly windows.
                  </p>
                </div>
                <span className="text-sm text-slate-400">Supabase payouts</span>
              </div>
              <div className="mt-10 flex min-h-[250px] flex-col items-center justify-center rounded-[1.75rem] bg-slate-50">
                {recentPayoutActivity.maxValue > 0 ? (
                  <div className="w-full px-4 sm:px-8">
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-[rgba(7,107,210,0.1)] px-3 py-1 text-sm font-medium text-accent">
                        {formatCompactCurrency(recentPayoutActivity.committedTotal)} committed
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                        {formatCompactCurrency(recentPayoutActivity.releasedTotal)} released
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500">
                        {formatCompactCurrency(payoutReadyTotal)} ready
                      </span>
                    </div>
                    <div className="grid grid-cols-4 items-end gap-4">
                      {recentPayoutActivity.buckets.map((point) => (
                        <div
                          key={point.label}
                          className="flex flex-col items-center gap-3"
                        >
                          <div className="flex h-40 w-full items-end rounded-full bg-white p-2 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)]">
                            <div
                              className="w-full rounded-full bg-[linear-gradient(180deg,_#5BA7F7,_#076BD2)]"
                              style={{
                                height:
                                  point.value > 0
                                    ? `${clampPercent(
                                        (point.value / recentPayoutActivity.maxValue) * 100,
                                      )}%`
                                    : "0%",
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">
                            {formatCompactCurrency(point.value || 0)}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {point.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-6 text-center text-sm text-slate-500">
                      Creator payouts totaling{" "}
                      {formatCompactCurrency(recentPayoutActivity.committedTotal)} hit
                      the payout pipeline over the last four weeks.
                    </p>
                  </div>
                ) : (
                  <>
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-400 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)]">
                      <ArrowUpRightIcon className="h-8 w-8" />
                    </span>
                    <p className="mt-6 text-xl font-medium text-slate-500">
                      No payout activity in the last four weeks
                    </p>
                  </>
                )}
              </div>
            </SectionPanel>
          </FadeIn>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <FadeIn>
            <SectionPanel>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                    Campaign Momentum
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Real pipeline conversion pulled from current campaign activity.
                  </p>
                </div>
                <span className="rounded-full bg-[rgba(7,107,210,0.1)] px-3 py-1 text-sm font-medium text-accent">
                  Supabase live
                </span>
              </div>
              <div className="mt-8 space-y-5">
                {campaignMomentum.length ? (
                  campaignMomentum.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {campaign.title}
                          </p>
                          <p className="text-sm text-slate-500">
                            {campaign.applications} applications • {campaign.accepted} accepted •{" "}
                            {campaign.approved} approved
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                            getStatusClasses(campaign.status),
                          )}
                        >
                          {campaign.status}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Slot fill
                            </p>
                            <p className="text-sm font-medium text-slate-500">
                              {formatPercent(campaign.slotFillRate)}
                            </p>
                          </div>
                          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,_#076BD2,_#60A5FA)]"
                              style={{
                                width:
                                  campaign.slotFillRate > 0
                                    ? `${clampPercent(campaign.slotFillRate)}%`
                                    : "0%",
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Approval rate
                            </p>
                            <p className="text-sm font-medium text-slate-500">
                              {formatPercent(campaign.approvalRate)}
                            </p>
                          </div>
                          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,_#10B981,_#34D399)]"
                              style={{
                                width:
                                  campaign.approvalRate > 0
                                    ? `${clampPercent(campaign.approvalRate)}%`
                                    : "0%",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                        <span>{campaign.creatorSlots} creator slots</span>
                        <span>{formatCompactCurrency(campaign.budget)} budget</span>
                        <span>{formatCompactCurrency(campaign.averageRate)} avg. rate</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
                    Campaign momentum will appear once real campaign activity reaches
                    Supabase.
                  </div>
                )}
              </div>
            </SectionPanel>
          </FadeIn>

          <FadeIn delay={0.08}>
            <SectionPanel>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                    Top Creators
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    The strongest performers in your current pipeline.
                  </p>
                </div>
                <Link
                  href="/dashboard/creators"
                  className="text-sm font-medium text-accent transition hover:text-blue-500"
                >
                  View roster
                </Link>
              </div>
              <div className="mt-8 space-y-4">
                {topCreators.length ? (
                  topCreators.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 px-4 py-4"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                          {getInitials(creator.name)}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-950">
                            {creator.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {creator.headline ?? creator.focus}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-950">
                          {creator.rate > 0 ? formatCurrency(creator.rate) : "Open"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {creator.applications} applications
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
                    Creator rankings will populate once creators complete their
                    profiles or start applying to campaigns.
                  </div>
                )}
              </div>
            </SectionPanel>
          </FadeIn>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <FadeIn>
            <SectionPanel>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                    Create Campaign
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Start a new brief on a dedicated page, then return here to track
                    campaign traction and creator response.
                  </p>
                </div>
                <span className="rounded-full bg-[rgba(7,107,210,0.1)] px-3 py-1 text-sm font-medium text-accent">
                  Workspace flow
                </span>
              </div>
              <div className="mt-8 rounded-[1.75rem] bg-[linear-gradient(135deg,_rgba(231,242,255,0.95),_rgba(255,255,255,0.98))] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Campaign setup
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Use the full campaign editor when the brief needs deliverables,
                  usage rights, targeting, and payment terms set properly. Inline
                  editing has been moved out of the dashboard.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/creators/campaigns/new"
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[color:#076BD2] px-5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.2)] transition hover:bg-[#0559AE]"
                  >
                    Create campaign
                  </Link>
                  <Link
                    href="/dashboard/creators"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-accent/15 bg-[rgba(7,107,210,0.06)] px-5 text-sm font-semibold text-accent transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.1)]"
                  >
                    Open creators workspace
                  </Link>
                </div>
              </div>
            </SectionPanel>
          </FadeIn>

          <FadeIn delay={0.08}>
            <SectionPanel>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                    Recent Campaigns
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Active briefs and how much pipeline they are attracting.
                  </p>
                </div>
              </div>
              <div className="mt-8 space-y-4">
                {data.campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-[1.5rem] border border-slate-200 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {campaign.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {campaign.platforms.join(" • ")}
                        </p>
                        <p className="mt-2 text-sm font-medium text-accent">
                          {campaign.product_name || campaign.content_type}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          getStatusClasses(campaign.status),
                        )}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <p>Content type</p>
                        <p className="mt-2 font-semibold text-slate-950">
                          {campaign.content_type}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <p>Deadline</p>
                        <p className="mt-2 font-semibold text-slate-950">
                          {campaign.deadline ? formatDate(campaign.deadline) : "Flexible"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <p>Usage rights</p>
                        <p className="mt-2 font-semibold text-slate-950">
                          {campaign.usage_rights || "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-4 text-sm text-slate-500">
                      <span>{campaign.application_count} submissions</span>
                      <span>{formatCurrency(campaign.budget)}</span>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/dashboard/creators/campaigns/${campaign.id}/edit`}
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-accent/15 bg-[rgba(7,107,210,0.06)] px-4 text-sm font-semibold text-accent transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.1)]"
                      >
                        Edit brief
                      </Link>
                    </div>
                  </div>
                ))}
                {!data.campaigns.length ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
                    Your first campaign will appear here as soon as you publish it.
                  </div>
                ) : null}
              </div>
            </SectionPanel>
          </FadeIn>
        </div>
      </div>
    );
  }

  function renderSubmissionsSection() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Pending applicants",
              value: String(pendingReviews),
              tone: "bg-slate-900 text-white",
            },
            {
              label: "Awaiting review",
              value: String(pendingSubmissionReviews),
              tone: "bg-amber-50 text-amber-700",
            },
            {
              label: "Approved value",
              value: formatCompactCurrency(approvedSubmissionValue || 0),
              tone: "bg-emerald-50 text-emerald-700",
            },
          ].map((metric) => (
            <HoverLift
              key={metric.label}
              className={cn(
                "rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]",
                metric.tone,
              )}
            >
              <p className="text-sm opacity-70">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
            </HoverLift>
          ))}
        </div>
        <BrandSubmissionsPanel
          applications={data.applications}
          submissions={data.submissions}
        />
      </div>
    );
  }

  function renderChatSection() {
    return <RealtimeChatPanel profile={profile} role="brand" candidates={chatCandidates} />;
  }

  function renderAdsSection() {
    return <BrandMetaPanel mode="ads" />;
  }

  function renderAnalyticsSection() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
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
          ].map((metric) => (
            <SectionPanel key={metric.label} className="p-5">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {metric.value}
              </p>
              <p className="mt-2 text-sm text-slate-500">{metric.hint}</p>
            </SectionPanel>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <SectionPanel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                  Performance Funnel
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  From campaign launches to approved creator work.
                </p>
              </div>
            </div>
            <div className="mt-8 space-y-5">
              {analyticsFunnel.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-sm font-medium text-slate-700">
                        {item.label}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
                    </div>
                    <span className="text-sm text-slate-500">
                      {formatCompactNumber(item.value)}
                    </span>
                  </div>
                  <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,_#076BD2,_#60A5FA)]"
                      style={{
                        width: `${Math.max(
                          10,
                          Math.round(safePercent(item.value, maxFunnelValue)),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>
          <SectionPanel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                  Finance & Delivery
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Funding coverage, creator pricing, and payout pace from live records.
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Funding coverage",
                  value: formatPercent(fundingCoverageRate),
                  helper: `${formatCompactCurrency(paidFundingTotal)} funded of ${formatCompactCurrency(totalBudget)}`,
                },
                {
                  label: "Budget committed",
                  value: formatPercent(budgetCommittedRate),
                  helper: `${formatCompactCurrency(totalPayoutsGross)} allocated gross`,
                },
                {
                  label: "Avg. creator rate",
                  value: formatCurrency(averageAcceptedRate),
                  helper: acceptedCount
                    ? `${acceptedCount} accepted creators`
                    : "No accepted creators yet",
                },
                {
                  label: "Avg. payout time",
                  value: formatDurationDays(getAverage(payoutDurations)),
                  helper: payoutDurations.length
                    ? `${payoutDurations.length} payouts completed`
                    : "No released payouts yet",
                },
                {
                  label: "Queued creator payouts",
                  value: formatCompactCurrency(payoutReadyTotal),
                  helper: `${data.payouts.filter((payout) => payout.status === "payout_ready").length} awaiting release`,
                },
                {
                  label: "Revision request rate",
                  value: formatPercent(
                    safePercent(revisionRequests, Math.max(data.submissions.length, 1)),
                  ),
                  helper: `${revisionRequests} revisions requested`,
                },
              ].map((metric) => (
                <div key={metric.label} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{metric.helper}</p>
                </div>
              ))}
            </div>
          </SectionPanel>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionPanel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                  Campaign Scorecard
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Rank active briefs by creator demand, approvals, funding, and payout delivery.
                </p>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              {campaignPerformance.length ? (
                campaignPerformance.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-[1.5rem] border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {campaign.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {campaign.applications} applicants • {campaign.accepted}/
                          {campaign.creatorSlots} slots accepted
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          getStatusClasses(campaign.status),
                        )}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Fill rate</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {formatPercent(campaign.slotFillRate)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Approval rate</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {formatPercent(campaign.approvalRate)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Avg. rate</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {formatCurrency(campaign.averageRate)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Paid out</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {formatCompactCurrency(campaign.paidOut)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                          <span>Funding progress</span>
                          <span>{formatPercent(safePercent(campaign.funded, campaign.budget))}</span>
                        </div>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,_#076BD2,_#60A5FA)]"
                            style={{
                              width: `${Math.max(
                                8,
                                Math.min(
                                  100,
                                  Math.round(safePercent(campaign.funded, campaign.budget)),
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                          {formatCompactCurrency(campaign.funded)} funded of{" "}
                          {formatCompactCurrency(campaign.budget)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Workflow</p>
                        <p className="mt-2 text-base font-semibold text-slate-950">
                          {campaign.shortlisted} shortlisted • {campaign.submissions} submitted
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          {campaign.approved} approved • {campaign.revisionRequested} revisions
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/dashboard/creators/campaigns/${campaign.id}/edit`}
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-accent/15 bg-[rgba(7,107,210,0.06)] px-4 text-sm font-semibold text-accent transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.1)]"
                      >
                        Edit brief
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                  Launch a campaign to unlock your analytics scorecard.
                </div>
              )}
            </div>
          </SectionPanel>

          <SectionPanel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                  Top Content
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Recently approved deliveries with the strongest completion signals.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                {approvedDeliveries.length} approved
              </span>
            </div>
            <div className="mt-8 space-y-4">
              {approvedDeliveries.length ? (
                approvedDeliveries.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-[1.5rem] border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {submission.creator_name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {submission.campaign_title}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Approved
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Creator payout</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {formatCurrency(submission.rate)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Assets delivered</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {submission.assets.length + submission.content_links.length}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Reviewed</p>
                        <p className="mt-2 text-base font-semibold text-slate-950">
                          {submission.reviewed_at
                            ? formatDate(submission.reviewed_at)
                            : "Pending"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Revision</p>
                        <p className="mt-2 text-base font-semibold text-slate-950">
                          V{submission.revision_number}
                        </p>
                      </div>
                    </div>
                    {submission.feedback ? (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="font-semibold text-slate-950">Review note</p>
                        <p className="mt-2">{submission.feedback}</p>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                  Approved creator deliveries will appear here once campaigns move through review.
                </div>
              )}
            </div>
          </SectionPanel>
        </div>
      </div>
    );
  }

  function renderCreatorsSection() {
    return (
      <BrandCreatorsHub
        brandId={profile.id}
        campaigns={data.campaigns}
        creators={data.creators}
      />
    );
  }

  function renderFinanceSection() {
    return (
      <BrandFinancePanel
        campaigns={data.campaigns}
        fundings={data.fundings}
        payouts={data.payouts}
      />
    );
  }

  function renderIntegrationsSection() {
    return <BrandIntegrationsPanel />;
  }

  function renderSettingsSection() {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionPanel>
          <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
            Workspace Settings
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              {
                label: "Company",
                value: displayName,
              },
              {
                label: "Email",
                value: profile.email,
              },
              {
                label: "Role",
                value: "Brand owner",
              },
              {
                label: "Workspace",
                value: "CIRCL HQ",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </SectionPanel>
        <SectionPanel>
          <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
            Preferences
          </h2>
          <div className="mt-8 space-y-4">
            {[
              "Creator application notifications",
              "Campaign performance recaps",
              "Finance summary emails",
              "Weekly roster recommendations",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 px-4 py-4"
              >
                <span className="font-medium text-slate-800">{item}</span>
                <span
                  className={cn(
                    "flex h-7 w-12 items-center rounded-full p-1 transition",
                    index < 3 ? "justify-end bg-accent" : "justify-start bg-slate-200",
                  )}
                >
                  <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <SignOutButton variant="light" />
          </div>
        </SectionPanel>
      </div>
    );
  }

  function renderSectionContent() {
    switch (section) {
      case "dashboard":
        return renderDashboardSection();
      case "submissions":
        return renderSubmissionsSection();
      case "chat":
        return renderChatSection();
      case "ads":
        return renderAdsSection();
      case "analytics":
        return renderAnalyticsSection();
      case "creators":
        return renderCreatorsSection();
      case "finance":
        return renderFinanceSection();
      case "integrations":
        return renderIntegrationsSection();
      case "settings":
        return renderSettingsSection();
      default:
        return null;
    }
  }

  const navGroups: WorkspaceNavGroup[] = [
    {
      items: brandWorkspaceSections
        .filter((item) => item.group === "primary")
        .map((item) => {
          const Icon = sectionIcons[item.slug];

          return {
            href: getBrandWorkspaceHref(item.slug),
            label: item.label,
            active: item.slug === section,
            icon: <Icon className="h-5 w-5" />,
            badge:
              item.slug === "submissions" && pendingReviews > 0
                ? String(pendingReviews)
                : null,
          };
        }),
    },
    {
      label: "Configuration",
      items: brandWorkspaceSections
        .filter((item) => item.group === "configuration")
        .map((item) => {
          const Icon = sectionIcons[item.slug];

          return {
            href: getBrandWorkspaceHref(item.slug),
            label: item.label,
            active: item.slug === section,
            icon: <Icon className="h-5 w-5" />,
          };
        }),
    },
  ];
  const heroTitle = detailView
    ? detailView.title
    : section === "dashboard"
      ? `Welcome back, ${welcomeName}.`
      : activeSection.label;
  const heroDescription = detailView
    ? detailView.description
    : section === "dashboard"
      ? "Run creator sourcing, campaign delivery, approvals, and payouts from a single operating surface."
      : activeSection.description;
  const isSubmissionsOverview = !detailView && section === "submissions";
  const headerActions = (
    <>
      <span
        className={cn(
          "rounded-full px-4 py-2 text-sm font-semibold",
          pendingReviews
            ? "bg-amber-50 text-amber-700"
            : "bg-emerald-50 text-emerald-700",
        )}
      >
        {pendingReviews
          ? `${pendingReviews} applications in queue`
          : "Review queue clear"}
      </span>
      <SignOutButton variant="light" />
    </>
  );
  const topBanner =
    detailView?.banner ?? (
      <WorkspacePanel className="bg-[linear-gradient(135deg,_rgba(8,145,178,0.08),_rgba(255,255,255,0.9),_rgba(7,107,210,0.1))]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
              Focus lane
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {pendingReviews || pendingSubmissionReviews
                ? "Keep creator reviews moving before they slow campaign pacing."
                : "Everything live is moving cleanly across creators, content, and payout ops."}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              {pendingReviews || pendingSubmissionReviews
                ? `${pendingReviews} applications and ${pendingSubmissionReviews} submissions are ready for action. Jump straight into review or open chat to unblock creators.`
                : "Your current programs are synced, replies are flowing, and there is no active review backlog blocking delivery."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NotificationsCenter profile={profile} />
            <Link
              href="/dashboard/chat"
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open chat
            </Link>
          </div>
        </div>
      </WorkspacePanel>
    );
  const sidebarFooter = (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(239,246,255,0.96))] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="absolute -right-10 top-0 h-20 w-20 rounded-full bg-[radial-gradient(circle,_rgba(7,107,210,0.18),_transparent_70%)]" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Pipeline
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          {pendingReviews + pendingSubmissionReviews > 0
            ? `${pendingReviews + pendingSubmissionReviews} items need action`
            : "Operations are in sync"}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {revisionRequests > 0
            ? `${revisionRequests} revisions are still open with creators.`
            : "Use the creator roster to source the next wave before demand slows down."}
        </p>
        <Link
          href="/dashboard/creators"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-slate-50"
        >
          Open creator roster
        </Link>
      </div>
    </div>
  );

  const content = detailView ? detailView.content : renderSectionContent();

  if (renderMode === "content") {
    return (
      <WorkspaceMainContent
        tone="brand"
        eyebrow={
          detailView
            ? "Review detail"
            : section === "dashboard"
              ? "Brand operating system"
              : "Brand workspace"
        }
        title={heroTitle}
        description={heroDescription}
        metaItems={detailView?.metaItems ?? primaryStats}
        topBanner={topBanner}
        showTopBanner={!isSubmissionsOverview}
        showHeroSection={!isSubmissionsOverview}
        headerActions={headerActions}
      >
        {content}
      </WorkspaceMainContent>
    );
  }

  return (
    <WorkspaceShell
      tone="brand"
      displayName={displayName}
      roleLabel="Brand workspace"
      initials={getInitials(displayName)}
      eyebrow={
        detailView
          ? "Review detail"
          : section === "dashboard"
            ? "Brand operating system"
            : "Brand workspace"
      }
      title={heroTitle}
      description={heroDescription}
      navGroups={navGroups}
      metaItems={detailView?.metaItems ?? primaryStats}
      topBanner={topBanner}
      showTopBanner={!isSubmissionsOverview}
      showHeroSection={!isSubmissionsOverview}
      headerActions={headerActions}
      sidebarFooter={sidebarFooter}
    >
      {content}
    </WorkspaceShell>
  );
}

export function BrandWorkspaceChrome({
  profile,
  data,
  section,
  children,
}: BrandWorkspaceChromeProps) {
  const displayName = getDisplayName(profile.company_name, "CIRCL Brand");
  const pendingReviews = data.applications.filter(
    (application) => application.status === "pending",
  ).length;
  const pendingSubmissionReviews = data.submissions.filter(
    (submission) => submission.status === "submitted",
  ).length;
  const revisionRequests = data.submissions.filter(
    (submission) => submission.status === "revision_requested",
  ).length;
  const navGroups: WorkspaceNavGroup[] = [
    {
      label: "Operations",
      items: brandWorkspaceSections
        .filter((item) => item.group === "primary")
        .map((item) => {
          const Icon = sectionIcons[item.slug];

          return {
            href: getBrandWorkspaceHref(item.slug),
            label: item.label,
            active: item.slug === section,
            icon: <Icon className="h-5 w-5" />,
            badge:
              item.slug === "submissions" && pendingReviews > 0
                ? String(pendingReviews)
                : null,
          };
        }),
    },
    {
      label: "Configuration",
      items: brandWorkspaceSections
        .filter((item) => item.group === "configuration")
        .map((item) => {
          const Icon = sectionIcons[item.slug];

          return {
            href: getBrandWorkspaceHref(item.slug),
            label: item.label,
            active: item.slug === section,
            icon: <Icon className="h-5 w-5" />,
          };
        }),
    },
  ];
  const sidebarFooter = (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(239,246,255,0.96))] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="absolute -right-10 top-0 h-20 w-20 rounded-full bg-[radial-gradient(circle,_rgba(7,107,210,0.18),_transparent_70%)]" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Pipeline
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          {pendingReviews + pendingSubmissionReviews > 0
            ? `${pendingReviews + pendingSubmissionReviews} items need action`
            : "Operations are in sync"}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {revisionRequests > 0
            ? `${revisionRequests} revisions are still open with creators.`
            : "Use the creator roster to source the next wave before demand slows down."}
        </p>
        <Link
          href="/dashboard/creators"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-slate-50"
        >
          Open creator roster
        </Link>
      </div>
    </div>
  );

  return (
    <WorkspaceViewport tone="brand">
      <WorkspaceSidebar
        tone="brand"
        displayName={displayName}
        roleLabel="Brand workspace"
        initials={getInitials(displayName)}
        navGroups={navGroups}
        sidebarFooter={sidebarFooter}
      />
      <div className="min-w-0">{children}</div>
    </WorkspaceViewport>
  );
}
