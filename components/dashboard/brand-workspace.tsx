"use client";

import Link from "next/link";
import { type JSX, type ReactNode, useMemo } from "react";
import { BrandCampaignComposer } from "@/components/dashboard/brand-campaign-composer";
import { BrandIntegrationsPanel } from "@/components/dashboard/brand-integrations-panel";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { StripeActionButton } from "@/components/dashboard/stripe-action-button";
import {
  FadeIn,
  HoverLift,
  MotionScale,
  PageTransition,
} from "@/components/shared/motion";
import {
  brandWorkspaceSections,
  getBrandWorkspaceHref,
  type BrandWorkspaceSection,
} from "@/lib/brand-workspace";
import type { BrandDashboardData, UserProfile } from "@/lib/types";
import {
  cn,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  getDisplayName,
  getInitials,
} from "@/lib/utils";

type BrandWorkspaceProps = {
  profile: UserProfile & { role: "brand" };
  data: BrandDashboardData;
  section: BrandWorkspaceSection;
};

type CreatorSpotlight = {
  name: string;
  headline: string | null;
  applications: number;
  accepted: number;
  rate: number;
  campaignTitle: string;
  focus: string;
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

const fallbackCreators: CreatorSpotlight[] = [
  {
    name: "Mia Harper",
    headline: "Beauty and skincare storyteller",
    applications: 3,
    accepted: 1,
    rate: 980,
    campaignTitle: "Spring UGC Sprint",
    focus: "TikTok UGC",
  },
  {
    name: "Noah Ellis",
    headline: "Performance creative editor",
    applications: 2,
    accepted: 1,
    rate: 1250,
    campaignTitle: "Creator Seeding Program",
    focus: "Paid social edits",
  },
  {
    name: "Ava Morgan",
    headline: "Lifestyle creator for premium consumer brands",
    applications: 4,
    accepted: 2,
    rate: 1450,
    campaignTitle: "Creator Seeding Program",
    focus: "Lifestyle UGC",
  },
];

const emptySeries = [
  { label: "W1", value: 28 },
  { label: "W2", value: 44 },
  { label: "W3", value: 63 },
  { label: "W4", value: 52 },
];

function buildCreatorRoster(data: BrandDashboardData) {
  const creators = new Map<string, CreatorSpotlight>();

  for (const application of data.applications) {
    const existing = creators.get(application.creator_name);

    if (existing) {
      existing.applications += 1;
      existing.rate = Math.max(existing.rate, application.rate);

      if (application.status === "accepted") {
        existing.accepted += 1;
      }

      continue;
    }

    creators.set(application.creator_name, {
      name: application.creator_name,
      headline: application.creator_headline,
      applications: 1,
      accepted: application.status === "accepted" ? 1 : 0,
      rate: application.rate,
      campaignTitle: application.campaign_title,
      focus: application.campaign_title,
    });
  }

  return [...creators.values()].sort((left, right) => {
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

function getStatusClasses(status: string) {
  if (status === "accepted") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "shortlisted") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "active") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "connected") {
    return "bg-emerald-50 text-emerald-700";
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
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BrandWorkspace({
  profile,
  data,
  section,
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
  const shortlisted = data.applications.filter(
    (application) => application.status === "shortlisted",
  ).length;
  const acceptedCount = data.applications.filter(
    (application) => application.status === "accepted",
  ).length;
  const acceptedValue = data.applications
    .filter((application) => application.status === "accepted")
    .reduce((sum, application) => sum + application.rate, 0);
  const creatorRoster = useMemo(() => {
    const builtRoster = buildCreatorRoster(data);
    return builtRoster.length ? builtRoster : fallbackCreators;
  }, [data]);
  const topCreators = creatorRoster.slice(0, 4);
  const heroCampaign = data.campaigns[0];
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
  const transactions = (data.campaigns.length ? data.campaigns : [])
    .slice(0, 3)
    .map((campaign, index) => ({
      id: campaign.id,
      label: campaign.title,
      amount: Math.round(campaign.budget * (0.38 + index * 0.08)),
      status: index === 0 ? "Scheduled" : index === 1 ? "Queued" : "Draft",
    }));
  const chatThreads = topCreators.map((creator, index) => ({
    name: creator.name,
    headline: creator.headline ?? creator.focus,
    preview:
      index === 0
        ? "I can turn the latest brief around by Friday with three hook variations."
        : index === 1
          ? "Can you confirm if paid usage is included for Meta retargeting?"
          : "Shared concept directions and a revised shot list for review.",
    time: index === 0 ? "2m ago" : index === 1 ? "21m ago" : "1h ago",
    unread: index === 0 ? 2 : 0,
  }));
  const ads = (data.campaigns.length ? data.campaigns : [])
    .slice(0, 3)
    .map((campaign, index) => ({
      id: campaign.id,
      name: campaign.title,
      status: index === 0 ? "Scaling" : index === 1 ? "Testing" : "Draft",
      spend: Math.round(campaign.budget * (0.25 + index * 0.07)),
      roas: (1.9 + index * 0.4).toFixed(1),
      ctr: `${1.8 + index * 0.6}%`,
    }));
  const analyticsBars = data.campaigns.slice(0, 4).map((campaign, index) => ({
    label: campaign.title,
    value: clampPercent(46 + campaign.application_count * 9 + index * 7),
    meta: `${campaign.application_count} submissions`,
  }));
  const chartSeries =
    data.campaigns.length > 0
      ? data.campaigns.slice(0, 4).map((campaign, index) => ({
          label: `W${index + 1}`,
          value: clampPercent(30 + campaign.application_count * 11 + index * 5),
        }))
      : emptySeries;

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
                      Getting Started
                    </h2>
                    <p className="text-sm text-slate-500">
                      Launch the core pieces of your brand workspace.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500">
                  {completedSteps}/{onboardingSteps.length}
                </span>
              </div>
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
                    View the last 30 days of creator payouts and campaign pacing.
                  </p>
                </div>
                <span className="text-sm text-slate-400">Last 30 days</span>
              </div>
              <div className="mt-10 flex min-h-[250px] flex-col items-center justify-center rounded-[1.75rem] bg-slate-50">
                {acceptedValue > 0 ? (
                  <div className="w-full px-4 sm:px-8">
                    <div className="grid grid-cols-4 items-end gap-4">
                      {chartSeries.map((point) => (
                        <div
                          key={point.label}
                          className="flex flex-col items-center gap-3"
                        >
                          <div className="flex h-40 w-full items-end rounded-full bg-white p-2 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)]">
                            <div
                              className="w-full rounded-full bg-[linear-gradient(180deg,_#5BA7F7,_#076BD2)]"
                              style={{ height: `${point.value}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500">
                            {point.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-6 text-center text-sm text-slate-500">
                      Accepted creator work totals {formatCurrency(acceptedValue)}.
                    </p>
                  </div>
                ) : (
                  <>
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-400 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)]">
                      <ArrowUpRightIcon className="h-8 w-8" />
                    </span>
                    <p className="mt-6 text-xl font-medium text-slate-500">
                      No creator earnings data available
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
                    Creative Performance
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Which briefs are pulling the strongest creator response.
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-accent">
                  Response score
                </span>
              </div>
              <div className="mt-8 space-y-5">
                {(analyticsBars.length
                  ? analyticsBars
                  : [
                      {
                        label: "Spring UGC Sprint",
                        value: 74,
                        meta: "6 submissions",
                      },
                    ]).map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.label}
                        </p>
                        <p className="text-sm text-slate-500">{item.meta}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-500">
                        {item.value}%
                      </p>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,_#076BD2,_#60A5FA)]"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
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
                {topCreators.map((creator) => (
                  <div
                    key={creator.name}
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
                        {formatCurrency(creator.rate)}
                      </p>
                      <p className="text-sm text-slate-500">
                        {creator.applications} submissions
                      </p>
                    </div>
                  </div>
                ))}
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
                    Launch a Campaign
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Publish a fresh brief directly into the marketplace.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                  Supabase live
                </span>
              </div>
              <div className="mt-8">
                <BrandCampaignComposer brandId={profile.id} />
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
                    <div className="mt-5 flex items-center justify-between gap-4 text-sm text-slate-500">
                      <span>{campaign.application_count} submissions</span>
                      <span>{formatCurrency(campaign.budget)}</span>
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
              label: "Pending",
              value: String(pendingReviews),
              tone: "bg-slate-900 text-white",
            },
            {
              label: "Shortlisted",
              value: String(shortlisted),
              tone: "bg-amber-50 text-amber-700",
            },
            {
              label: "Accepted value",
              value: formatCompactCurrency(acceptedValue || 0),
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
        <SectionPanel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                Submission Queue
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Review every creator pitch tied to your current campaigns.
              </p>
            </div>
            <Link
              href="/dashboard/creators"
              className="text-sm font-medium text-accent transition hover:text-blue-500"
            >
              Browse creators
            </Link>
          </div>
          <div className="mt-8 space-y-4">
            {data.applications.length ? (
              data.applications.map((application) => (
                <div
                  key={application.id}
                  className="rounded-[1.5rem] border border-slate-200 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-slate-950">
                          {application.creator_name}
                        </h3>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                            getStatusClasses(application.status),
                          )}
                        >
                          {application.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {application.creator_headline ??
                          "Creator profile in review"}
                      </p>
                      <p className="mt-4 text-sm leading-7 text-slate-600">
                        {application.pitch}
                      </p>
                    </div>
                    <div className="grid min-w-[240px] gap-3 rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-600">
                      <div className="flex items-center justify-between gap-3">
                        <span>Campaign</span>
                        <span className="font-medium text-slate-900">
                          {application.campaign_title}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Rate</span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(application.rate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Submitted</span>
                        <span className="font-medium text-slate-900">
                          {formatDate(application.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                No submissions yet. Launch a campaign and creators will start appearing here.
              </div>
            )}
          </div>
        </SectionPanel>
      </div>
    );
  }

  function renderChatSection() {
    const activeThread = chatThreads[0];

    return (
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <FadeIn>
          <SectionPanel className="p-4">
            <div className="flex items-center justify-between gap-4 px-2 pb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Inbox</h2>
                <p className="text-sm text-slate-500">
                  Creator and team messages
                </p>
              </div>
              <MotionScale className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white">
                New thread
              </MotionScale>
            </div>
            <div className="space-y-2">
              {chatThreads.map((thread) => (
                <button
                  key={thread.name}
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[1.5rem] px-3 py-4 text-left transition",
                    thread.name === activeThread?.name
                      ? "bg-slate-100"
                      : "hover:bg-slate-50",
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                    {getInitials(thread.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold text-slate-950">
                        {thread.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {thread.time}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-sm text-slate-500">
                      {thread.preview}
                    </span>
                  </span>
                  {thread.unread ? (
                    <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-accent px-2 text-xs font-semibold text-white">
                      {thread.unread}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </SectionPanel>
        </FadeIn>

        <FadeIn delay={0.08}>
          <SectionPanel className="min-h-[620px]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                  {getInitials(activeThread?.name)}
                </span>
                <div>
                  <p className="font-semibold text-slate-950">
                    {activeThread?.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {activeThread?.headline ?? "Creator"}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                Active
              </span>
            </div>
            <div className="space-y-6 py-8">
              <div className="max-w-xl rounded-[1.5rem] bg-slate-100 px-5 py-4 text-sm leading-7 text-slate-700">
                Shared the updated product brief and usage window for the next paid run.
              </div>
              <div className="ml-auto max-w-xl rounded-[1.5rem] bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 py-4 text-sm leading-7 text-white">
                Perfect. I can send first concepts tonight and final selects within two days.
              </div>
              <div className="max-w-xl rounded-[1.5rem] bg-slate-100 px-5 py-4 text-sm leading-7 text-slate-700">
                Please include one hook variation tailored for retargeting and a clean product-only edit.
              </div>
            </div>
            <div className="mt-auto rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  placeholder="Reply to the thread"
                  className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <MotionScale className="h-12 rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white">
                  Send message
                </MotionScale>
              </div>
            </div>
          </SectionPanel>
        </FadeIn>
      </div>
    );
  }

  function renderAdsSection() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Active ad sets",
              value: String(ads.length || 1),
            },
            {
              label: "Media spend",
              value: formatCompactCurrency(
                ads.reduce((sum, ad) => sum + ad.spend, 0) || 1200,
              ),
            },
            {
              label: "Average ROAS",
              value:
                ads.length > 0
                  ? `${(
                      ads.reduce((sum, ad) => sum + Number(ad.roas), 0) /
                      ads.length
                    ).toFixed(1)}x`
                  : "2.1x",
            },
          ].map((metric) => (
            <SectionPanel key={metric.label} className="p-5">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {metric.value}
              </p>
            </SectionPanel>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          {ads.length ? (
            ads.map((ad) => (
              <HoverLift key={ad.id} className="h-full">
                <SectionPanel className="h-full">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-950">
                        {ad.name}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        Creator content pushed into paid testing.
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusClasses(
                          ad.status === "Scaling" ? "active" : "pending",
                        ),
                      )}
                    >
                      {ad.status}
                    </span>
                  </div>
                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[1.5rem] bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Spend</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {formatCurrency(ad.spend)}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">ROAS</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {ad.roas}x
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">CTR</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {ad.ctr}
                      </p>
                    </div>
                  </div>
                </SectionPanel>
              </HoverLift>
            ))
          ) : (
            <SectionPanel className="xl:col-span-2">
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                No ad experiments yet. Turn one of your creator campaigns into a paid test and it will appear here.
              </div>
            </SectionPanel>
          )}
        </div>
      </div>
    );
  }

  function renderAnalyticsSection() {
    const averageAcceptedRate = acceptedCount
      ? acceptedValue / acceptedCount
      : 1180;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Creator response rate",
              value: `${clampPercent(42 + shortlisted * 9)}%`,
            },
            {
              label: "Avg. creator rate",
              value: formatCurrency(averageAcceptedRate),
            },
            {
              label: "Campaign conversion",
              value: `${clampPercent(18 + pendingReviews * 4)}%`,
            },
          ].map((metric) => (
            <SectionPanel key={metric.label} className="p-5">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {metric.value}
              </p>
            </SectionPanel>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
              {[
                {
                  label: "Campaigns launched",
                  value: data.campaigns.length || 1,
                  width: 100,
                },
                {
                  label: "Applications received",
                  value: data.applications.length || 3,
                  width: 82,
                },
                {
                  label: "Creators shortlisted",
                  value: shortlisted || 2,
                  width: 58,
                },
                {
                  label: "Creators accepted",
                  value: acceptedCount || 1,
                  width: 36,
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-slate-700">
                      {item.label}
                    </span>
                    <span className="text-sm text-slate-500">{item.value}</span>
                  </div>
                  <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,_#076BD2,_#60A5FA)]"
                      style={{ width: `${item.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionPanel>
          <SectionPanel>
            <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
              Campaign Scorecard
            </h2>
            <div className="mt-8 space-y-4">
              {data.campaigns.length ? (
                data.campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-[1.5rem] border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-slate-950">
                        {campaign.title}
                      </p>
                      <span className="text-sm text-slate-500">
                        {campaign.application_count} creators
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Budget</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {formatCurrency(campaign.budget)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Platforms</p>
                        <p className="mt-2 text-base font-semibold text-slate-950">
                          {campaign.platforms.join(", ")}
                        </p>
                      </div>
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
        </div>
      </div>
    );
  }

  function renderCreatorsSection() {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {creatorRoster.map((creator) => (
            <HoverLift key={creator.name} className="h-full">
              <SectionPanel className="h-full">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-slate-900 text-sm font-semibold text-white">
                      {getInitials(creator.name)}
                    </span>
                    <div>
                      <p className="text-xl font-semibold text-slate-950">
                        {creator.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {creator.headline ?? creator.focus}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-accent">
                    {creator.focus}
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Apps
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {creator.applications}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Won
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {creator.accepted}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Rate
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {formatCompactCurrency(creator.rate)}
                    </p>
                  </div>
                </div>
                <p className="mt-6 text-sm leading-7 text-slate-600">
                  Best fit for {creator.campaignTitle}. Strong match for premium short-form creative and paid amplification.
                </p>
                <div className="mt-6 flex gap-3">
                  <MotionScale className="flex-1 rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-4 py-3 text-sm font-semibold text-white">
                    Invite to brief
                  </MotionScale>
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    View profile
                  </button>
                </div>
              </SectionPanel>
            </HoverLift>
          ))}
        </div>
      </div>
    );
  }

  function renderFinanceSection() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Committed spend",
              value: formatCompactCurrency(totalBudget || 0),
            },
            {
              label: "Accepted creator work",
              value: formatCompactCurrency(acceptedValue || 0),
            },
            {
              label: "Active campaign budget",
              value: formatCompactCurrency(
                activeCampaigns.reduce((sum, campaign) => sum + campaign.budget, 0) ||
                  0,
              ),
            },
          ].map((metric) => (
            <SectionPanel key={metric.label} className="p-5">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {metric.value}
              </p>
            </SectionPanel>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionPanel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                  Fund Campaigns
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Use Stripe Checkout to top up brand payments for creator work.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-accent">
                Brand payments
              </span>
            </div>
            <div className="mt-8 space-y-4 rounded-[1.75rem] bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Next payment</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {heroCampaign
                      ? formatCurrency(Math.max(heroCampaign.budget, 100))
                      : formatCurrency(1000)}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-500">
                  Secure checkout
                </span>
              </div>
              <StripeActionButton
                endpoint="/api/stripe/checkout"
                payload={{
                  campaignId: heroCampaign?.id ?? null,
                  title: heroCampaign?.title ?? "Campaign wallet top-up",
                  amount: heroCampaign?.budget ?? 1000,
                }}
                label="Top up with Stripe"
                pendingLabel="Redirecting to Stripe..."
                tone="light"
              />
            </div>
          </SectionPanel>
          <SectionPanel>
            <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
              Budget Timeline
            </h2>
            <div className="mt-8 space-y-4">
              {(transactions.length
                ? transactions
                : [
                    {
                      id: "fallback-finance-1",
                      label: "Creator seeding top-up",
                      amount: 1200,
                      status: "Scheduled",
                    },
                  ]).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.status}</p>
                  </div>
                  <p className="text-lg font-semibold text-slate-950">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          </SectionPanel>
        </div>
      </div>
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

  return (
    <PageTransition className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(7,107,210,0.1),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#f3f6fb_48%,_#eef2f8_100%)] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-[1660px] lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 bg-white/85 px-5 py-5 backdrop-blur lg:min-h-screen lg:border-b-0 lg:border-r lg:px-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-slate-950 text-lg font-semibold text-white">
                {getInitials(displayName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl font-semibold text-slate-950">
                  {displayName}
                </p>
                <p className="text-sm text-slate-500">Owner</p>
              </div>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {brandWorkspaceSections
              .filter((item) => item.group === "primary")
              .map((item) => {
                const Icon = sectionIcons[item.slug];
                const isActive = item.slug === section;

                return (
                  <Link
                    key={item.slug}
                    href={getBrandWorkspaceHref(item.slug)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-lg font-medium transition",
                      isActive
                        ? "bg-slate-100 text-slate-950"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl",
                        isActive ? "text-accent" : "text-slate-500",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </nav>

          <div className="mt-10">
            <p className="px-4 text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
              Configuration
            </p>
            <div className="mt-3 space-y-2">
              {brandWorkspaceSections
                .filter((item) => item.group === "configuration")
                .map((item) => {
                  const Icon = sectionIcons[item.slug];
                  const isActive = item.slug === section;

                  return (
                    <Link
                      key={item.slug}
                      href={getBrandWorkspaceHref(item.slug)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-lg font-medium transition",
                        isActive
                          ? "bg-slate-100 text-slate-950"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl",
                          isActive ? "text-accent" : "text-slate-500",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        </aside>

        <main className="px-4 py-5 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex flex-col gap-4 rounded-[2rem] border border-blue-200/80 bg-[linear-gradient(180deg,_rgba(208,227,247,0.92),_rgba(230,239,250,0.92))] px-5 py-4 shadow-[0_15px_40px_rgba(7,107,210,0.08)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 text-slate-800">
                <span className="text-2xl">👋</span>
                <div>
                  <p className="text-xl font-medium">
                    Need help setting up your brand or inviting your creators?
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    CIRCL keeps campaign setup, creators, and payments in the same workspace.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/chat"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(7,107,210,0.2)] transition hover:opacity-95"
                >
                  Chat
                </Link>
                <span className="text-xl text-slate-500">×</span>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.06}>
            <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  {section === "dashboard"
                    ? `Welcome back, ${welcomeName}!`
                    : activeSection.label}
                </h1>
                <p className="mt-3 max-w-3xl text-lg text-slate-500">
                  {section === "dashboard"
                    ? "Manage your creators, campaigns, and content"
                    : activeSection.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {primaryStats.map((stat) => (
                    <span
                      key={stat.label}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                    >
                      <span className="text-slate-400">{stat.label}</span>{" "}
                      <span className="text-slate-950">{stat.value}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "rounded-[1.25rem] px-4 py-3 text-sm font-medium",
                    pendingReviews
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700",
                  )}
                >
                  {pendingReviews
                    ? `${pendingReviews} submissions need review`
                    : "You're all caught up"}
                </span>
                <SignOutButton variant="light" />
              </div>
            </div>
          </FadeIn>

          <div className="mt-8">{renderSectionContent()}</div>
        </main>
      </div>
    </PageTransition>
  );
}
