"use client";

import Link from "next/link";
import {
  type FormEvent,
  type JSX,
  type ReactNode,
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { StripeActionButton } from "@/components/dashboard/stripe-action-button";
import {
  FadeIn,
  HoverLift,
  MotionScale,
  PageTransition,
} from "@/components/shared/motion";
import {
  creatorWorkspaceSections,
  getCreatorWorkspaceHref,
  type CreatorWorkspaceSection,
} from "@/lib/creator-workspace";
import { createClient } from "@/lib/supabase/client";
import type { CreatorDashboardData, UserProfile } from "@/lib/types";
import {
  cn,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  getDisplayName,
  getInitials,
} from "@/lib/utils";

type CreatorWorkspaceProps = {
  profile: UserProfile & { role: "creator" };
  data: CreatorDashboardData;
  section: CreatorWorkspaceSection;
};

type DraftState = Record<string, { pitch: string; rate: string }>;

type BrandConnection = {
  name: string;
  headline: string | null;
  openCampaigns: number;
  applied: number;
  accepted: number;
  latestCampaign: string;
  platforms: string[];
};

type IconProps = {
  className?: string;
};

const sectionIcons: Record<
  CreatorWorkspaceSection,
  (props: IconProps) => JSX.Element
> = {
  home: HomeIcon,
  "my-brands": MyBrandsIcon,
  chat: ChatIcon,
  payouts: PayoutsIcon,
  profile: ProfileIcon,
};

const fallbackBrands: BrandConnection[] = [
  {
    name: "Northstar Labs",
    headline: "UGC-focused product launches",
    openCampaigns: 2,
    applied: 1,
    accepted: 0,
    latestCampaign: "Spring UGC Sprint",
    platforms: ["TikTok", "Instagram Reels"],
  },
  {
    name: "Pulse Studio",
    headline: "Mobile growth team",
    openCampaigns: 1,
    applied: 1,
    accepted: 1,
    latestCampaign: "Fitness App Testimonial Series",
    platforms: ["TikTok", "YouTube Shorts"],
  },
];

function splitFullName(value?: string | null) {
  const parts = (value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function buildBrandConnections(data: CreatorDashboardData) {
  const brands = new Map<string, BrandConnection>();

  for (const campaign of data.campaigns) {
    const existing = brands.get(campaign.brand_name);

    if (existing) {
      existing.openCampaigns += 1;
      existing.platforms = [...new Set([...existing.platforms, ...campaign.platforms])];
      continue;
    }

    brands.set(campaign.brand_name, {
      name: campaign.brand_name,
      headline: campaign.brand_headline,
      openCampaigns: 1,
      applied: 0,
      accepted: 0,
      latestCampaign: campaign.title,
      platforms: campaign.platforms,
    });
  }

  for (const application of data.applications) {
    const existing = brands.get(application.brand_name);

    if (existing) {
      existing.applied += 1;
      existing.latestCampaign = application.campaign_title;

      if (application.status === "accepted") {
        existing.accepted += 1;
      }

      continue;
    }

    brands.set(application.brand_name, {
      name: application.brand_name,
      headline: null,
      openCampaigns: 0,
      applied: 1,
      accepted: application.status === "accepted" ? 1 : 0,
      latestCampaign: application.campaign_title,
      platforms: [],
    });
  }

  return [...brands.values()].sort((left, right) => {
    const priorityDelta =
      right.accepted * 3 + right.applied - (left.accepted * 3 + left.applied);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return right.openCampaigns - left.openCampaigns;
  });
}

function getStatusClasses(status: string) {
  if (status === "accepted" || status === "connected") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "shortlisted") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "pending") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-600";
}

function HomeIcon({ className }: IconProps) {
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

function MyBrandsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="m4 12 4-3 4 3 4-3 4 3" />
      <path d="M4 15c1.4 1.3 2.7 2 4 2s2.6-.7 4-2c1.4 1.3 2.7 2 4 2s2.6-.7 4-2" />
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

function PayoutsIcon({ className }: IconProps) {
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

function ProfileIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function CameraIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M5 8h3l1.2-2h5.6L16 8h3v9H5Z" />
      <circle cx="12" cy="12.5" r="3" />
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
        "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CreatorWorkspace({
  profile,
  data,
  section,
}: CreatorWorkspaceProps) {
  const router = useRouter();
  const nameParts = useMemo(() => splitFullName(profile.full_name), [profile.full_name]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(
    null,
  );
  const [drafts, setDrafts] = useState<DraftState>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null);
  const [selectedThreadIndex, setSelectedThreadIndex] = useState(0);
  const [firstName, setFirstName] = useState(nameParts.firstName);
  const [lastName, setLastName] = useState(nameParts.lastName);
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const [isSavingProfile, startProfileSave] = useTransition();
  const deferredQuery = useDeferredValue(searchQuery);
  const activeSection =
    creatorWorkspaceSections.find((item) => item.slug === section) ??
    creatorWorkspaceSections[0];
  const displayName = getDisplayName(profile.full_name, "Creator");
  const brandConnections = useMemo(() => {
    const builtConnections = buildBrandConnections(data);
    return builtConnections.length ? builtConnections : fallbackBrands;
  }, [data]);
  const acceptedValue = data.applications
    .filter((application) => application.status === "accepted")
    .reduce((sum, application) => sum + application.rate, 0);
  const pendingValue = data.applications
    .filter((application) => application.status === "pending")
    .reduce((sum, application) => sum + application.rate, 0);
  const filteredCampaigns = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    if (!query) {
      return data.campaigns;
    }

    return data.campaigns.filter((campaign) => {
      const haystack = [
        campaign.title,
        campaign.brand_name,
        campaign.description,
        campaign.platforms.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [data.campaigns, deferredQuery]);
  const chatThreads = brandConnections.map((brand, index) => ({
    name: brand.name,
    headline: brand.headline ?? `${brand.openCampaigns} active briefs`,
    preview:
      index === 0
        ? "Would you be open to a second hook variation for the next round?"
        : index === 1
          ? "We loved the direction. Can you share revised footage tomorrow?"
          : "Thanks for applying. We are reviewing concepts this afternoon.",
    time: index === 0 ? "5m ago" : index === 1 ? "32m ago" : "2h ago",
    unread: index === 0 ? 1 : 0,
  }));
  const activeThread = chatThreads[selectedThreadIndex] ?? chatThreads[0];

  async function handleApply(campaignId: string) {
    const draft = drafts[campaignId];

    if (!draft?.pitch?.trim() || !draft?.rate?.trim()) {
      setFeedback("Add a pitch and your rate before applying.");
      return;
    }

    setFeedback(null);
    setPendingCampaignId(campaignId);

    const supabase = createClient();
    const { error } = await supabase.from("campaign_applications").insert({
      campaign_id: campaignId,
      creator_id: profile.id,
      pitch: draft.pitch,
      rate: Number(draft.rate),
      status: "pending",
    });

    if (error) {
      setFeedback(error.message);
      setPendingCampaignId(null);
      return;
    }

    setDrafts((current) => ({
      ...current,
      [campaignId]: { pitch: "", rate: "" },
    }));
    setPendingCampaignId(null);
    setFeedback("Application submitted. Refreshing dashboard...");
    startRefresh(() => {
      router.refresh();
    });
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileFeedback(null);

    const supabase = createClient();
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName || null,
        headline: headline.trim() || null,
      })
      .eq("id", profile.id);

    if (error) {
      setProfileFeedback(error.message);
      return;
    }

    setProfileFeedback("Profile updated successfully.");
    startProfileSave(() => {
      router.refresh();
    });
  }

  function renderHomeSection() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Open campaigns",
              value: String(data.campaigns.length),
            },
            {
              label: "Applications sent",
              value: String(data.applications.length),
            },
            {
              label: "Accepted pipeline",
              value: formatCompactCurrency(acceptedValue || 0),
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

        <SectionPanel>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                Discover Campaigns
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Search active briefs and submit tailored applications.
              </p>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by brand, title, or platform"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)] lg:max-w-sm"
            />
          </div>
          <div className="mt-8 grid gap-4">
            {filteredCampaigns.length ? (
              filteredCampaigns.map((campaign) => {
                const draft = drafts[campaign.id] ?? { pitch: "", rate: "" };
                const isExpanded = expandedCampaignId === campaign.id;

                return (
                  <HoverLift
                    key={campaign.id}
                    className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-semibold text-slate-950">
                            {campaign.title}
                          </h3>
                          {campaign.has_applied ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              Applied
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm font-medium text-accent">
                          {campaign.brand_name}
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {campaign.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {campaign.platforms.map((platform) => (
                            <span
                              key={platform}
                              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 lg:min-w-[220px]">
                        <div>
                          <p className="text-sm text-slate-500">Budget</p>
                          <p className="mt-2 text-xl font-semibold text-slate-950">
                            {formatCurrency(campaign.budget)}
                          </p>
                        </div>
                        <div className="text-sm text-slate-500">
                          <p>{campaign.payment_type}</p>
                          <p className="mt-1">{campaign.duration}</p>
                        </div>
                        {!campaign.has_applied ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCampaignId((current) =>
                                current === campaign.id ? null : campaign.id,
                              )
                            }
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent/30 hover:bg-blue-50"
                          >
                            {isExpanded ? "Hide application" : "Apply now"}
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {isExpanded && !campaign.has_applied ? (
                      <div className="mt-6 grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 md:grid-cols-[1fr_220px]">
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
              <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
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
                      <h3 className="text-lg font-semibold text-slate-950">
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

  function renderMyBrandsSection() {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {brandConnections.map((brand) => (
          <HoverLift key={brand.name} className="h-full">
            <SectionPanel className="h-full">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">
                    {brand.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {brand.headline ?? "Brand partnership pipeline"}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-accent">
                  {brand.applied} applied
                </span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Briefs
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {brand.openCampaigns}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Applied
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {brand.applied}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Accepted
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {brand.accepted}
                  </p>
                </div>
              </div>
              <p className="mt-6 text-sm leading-7 text-slate-600">
                Latest brief: {brand.latestCampaign}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {brand.platforms.length ? (
                  brand.platforms.map((platform) => (
                    <span
                      key={platform}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500"
                    >
                      {platform}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    Direct outreach
                  </span>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/dashboard/chat"
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-4 py-3 text-sm font-semibold text-white"
                >
                  Open chat
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  View briefs
                </Link>
              </div>
            </SectionPanel>
          </HoverLift>
        ))}
      </div>
    );
  }

  function renderChatSection() {
    return (
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <SectionPanel className="p-4">
          <div className="flex items-center justify-between gap-4 px-2 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Inbox</h2>
              <p className="text-sm text-slate-500">Brand messages</p>
            </div>
          </div>
          <div className="space-y-2">
            {chatThreads.map((thread, index) => (
              <button
                key={thread.name}
                type="button"
                onClick={() => setSelectedThreadIndex(index)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-[1.5rem] px-3 py-4 text-left transition",
                  index === selectedThreadIndex ? "bg-slate-100" : "hover:bg-slate-50",
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
                    <span className="text-xs text-slate-400">{thread.time}</span>
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

        <SectionPanel className="min-h-[560px]">
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
                  {activeThread?.headline}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
              Active
            </span>
          </div>
          <div className="space-y-6 py-8">
            <div className="max-w-xl rounded-[1.5rem] bg-slate-100 px-5 py-4 text-sm leading-7 text-slate-700">
              Thanks for applying. We really liked the product demo angle in your pitch.
            </div>
            <div className="ml-auto max-w-xl rounded-[1.5rem] bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 py-4 text-sm leading-7 text-white">
              Happy to refine the hooks and send over a second version if that helps.
            </div>
            <div className="max-w-xl rounded-[1.5rem] bg-slate-100 px-5 py-4 text-sm leading-7 text-slate-700">
              That works. Please include one variation that feels more paid-social friendly.
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                placeholder="Write a message"
                className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <MotionScale className="h-12 rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white">
                Send
              </MotionScale>
            </div>
          </div>
        </SectionPanel>
      </div>
    );
  }

  function renderPayoutsSection() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "Accepted work",
              value: formatCompactCurrency(acceptedValue || 0),
            },
            {
              label: "Pending work",
              value: formatCompactCurrency(pendingValue || 0),
            },
            {
              label: "Stripe status",
              value: profile.stripe_account_id ? "Connected" : "Not connected",
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

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <SectionPanel>
            <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
              Payout Setup
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Connect Stripe to receive creator payouts once a brand approves work.
            </p>
            <div className="mt-8 rounded-[1.75rem] bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Next action</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {profile.stripe_account_id
                  ? "Manage your connected payout account."
                  : "Finish Stripe onboarding to unlock payouts."}
              </p>
              <div className="mt-6">
                <StripeActionButton
                  endpoint="/api/stripe/connect"
                  label={
                    profile.stripe_account_id
                      ? "Open Stripe onboarding"
                      : "Connect Stripe"
                  }
                  pendingLabel="Opening Stripe..."
                  tone="light"
                />
              </div>
            </div>
          </SectionPanel>

          <SectionPanel>
            <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
              Earnings Timeline
            </h2>
            <div className="mt-8 space-y-4">
              {data.applications.length ? (
                data.applications.map((application) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 px-4 py-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-950">
                        {application.campaign_title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {application.brand_name} • {formatDate(application.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-950">
                        {formatCurrency(application.rate)}
                      </p>
                      <span
                        className={cn(
                          "mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          getStatusClasses(application.status),
                        )}
                      >
                        {application.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
                  Accepted and pending earnings will appear here.
                </div>
              )}
            </div>
          </SectionPanel>
        </div>
      </div>
    );
  }

  function renderProfileSection() {
    return (
      <div className="space-y-6">
        <SectionPanel className="max-w-5xl">
          <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
            Profile Information
          </h2>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="relative">
              <span className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-slate-950 text-4xl font-semibold text-white">
                {getInitials(displayName)}
              </span>
              <span className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] text-white shadow-[0_12px_24px_rgba(7,107,210,0.25)]">
                <CameraIcon className="h-5 w-5" />
              </span>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-950">Profile Photo</p>
              <p className="mt-2 text-sm text-slate-500">
                Avatar upload can be added next. For now, update your name and creator headline below.
              </p>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleProfileSave}>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="creator-first-name"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="creator-first-name"
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div>
                <label
                  htmlFor="creator-last-name"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="creator-last-name"
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="creator-email"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Email
              </label>
              <input
                id="creator-email"
                disabled
                value={profile.email}
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 outline-none"
              />
              <p className="mt-2 text-sm text-slate-400">Email cannot be changed</p>
            </div>

            <div>
              <label
                htmlFor="creator-headline"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Headline
              </label>
              <input
                id="creator-headline"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder="Beauty and lifestyle UGC creator"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <MotionScale
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex h-14 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-8 text-base font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </MotionScale>
              {profileFeedback ? (
                <p className="text-sm text-slate-500">{profileFeedback}</p>
              ) : null}
            </div>
          </form>
        </SectionPanel>

        <SectionPanel className="max-w-5xl">
          <h2 className="text-2xl font-semibold text-slate-950">Account</h2>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-900">Sign out of CIRCL</p>
              <p className="mt-2 text-sm text-slate-500">
                You can sign back in anytime with the same account.
              </p>
            </div>
            <SignOutButton variant="light" />
          </div>
        </SectionPanel>
      </div>
    );
  }

  function renderSectionContent() {
    switch (section) {
      case "home":
        return renderHomeSection();
      case "my-brands":
        return renderMyBrandsSection();
      case "chat":
        return renderChatSection();
      case "payouts":
        return renderPayoutsSection();
      case "profile":
        return renderProfileSection();
      default:
        return null;
    }
  }

  return (
    <PageTransition className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(7,107,210,0.08),_transparent_24%),linear-gradient(180deg,_#ffffff_0%,_#f7f9fc_100%)] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-white/90 px-5 py-8 backdrop-blur lg:border-b-0 lg:border-r lg:px-6">
          <div className="px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              CIRCL Creator
            </p>
            <div className="mt-4 flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-slate-950 text-sm font-semibold text-white">
                {getInitials(displayName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-slate-950">
                  {displayName}
                </p>
                <p className="text-sm text-slate-500">Creator workspace</p>
              </div>
            </div>
          </div>

          <nav className="mt-10 space-y-4">
            {creatorWorkspaceSections.map((item) => {
              const Icon = sectionIcons[item.slug];
              const isActive = item.slug === section;

              return (
                <Link
                  key={item.slug}
                  href={getCreatorWorkspaceHref(item.slug)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-[1.15rem] font-medium transition",
                    isActive
                      ? "text-accent"
                      : "text-slate-900 hover:text-accent",
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-12 px-2">
            <Link
              href="/dashboard"
              className="inline-flex h-16 w-full items-center justify-center rounded-[2rem] bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-6 text-xl font-semibold text-white shadow-[0_16px_32px_rgba(7,107,210,0.24)] transition hover:opacity-95"
            >
              +Submit
            </Link>
          </div>
        </aside>

        <main className="px-5 py-8 sm:px-8 lg:px-12">
          <FadeIn>
            <div className="max-w-5xl">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {section === "profile"
                  ? "Account Settings"
                  : section === "home"
                    ? `Welcome back, ${getDisplayName(firstName, "Creator")}`
                    : activeSection.label}
              </h1>
              <p className="mt-3 text-lg text-slate-500">
                {section === "home"
                  ? "Browse new opportunities, manage applications, and keep brand replies close."
                  : activeSection.description}
              </p>
            </div>
          </FadeIn>

          <div className="mt-10">{renderSectionContent()}</div>
        </main>
      </div>
    </PageTransition>
  );
}
