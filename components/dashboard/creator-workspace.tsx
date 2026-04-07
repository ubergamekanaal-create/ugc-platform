"use client";

import Link from "next/link";
import {
  type FormEvent,
  type JSX,
  type ReactNode,
  useEffect,
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { CreatorInvitationsPanel } from "@/components/dashboard/creator-invitations-panel";
import { CreatorPortfolioGallery } from "@/components/dashboard/creator-portfolio-gallery";
import { CreatorPayoutsPanel } from "@/components/dashboard/creator-payouts-panel";
import { CreatorSubmissionsPanel } from "@/components/dashboard/creator-submissions-panel";
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
  MotionScale,
} from "@/components/shared/motion";
import { buildCreatorChatCandidates } from "@/lib/chat/candidates";
import {
  creatorWorkspaceSections,
  getCreatorWorkspaceHref,
  type CreatorWorkspaceSection,
} from "@/lib/creator-workspace";
import { createClient } from "@/lib/supabase/client";
import type {
  CreatorDashboardData,
  CreatorProfileDetails,
  CreatorPortfolioAsset,
  UserProfile,
} from "@/lib/types";
import {
  cn,
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatFileSize,
  formatPercent,
  getDisplayName,
  getInitials,
} from "@/lib/utils";
import { GlobalInviteModal } from "../creators/global-invite-modal";

type CreatorWorkspaceProps = {
  profile: UserProfile & { role: "creator" };
  data: CreatorDashboardData;
  section: CreatorWorkspaceSection;
  renderMode?: "full" | "content";
};

type CreatorWorkspaceChromeProps = {
  profile: UserProfile & { role: "creator" };
  data: CreatorDashboardData;
  section: CreatorWorkspaceSection;
  children: ReactNode;
};

type DraftState = Record<string, { pitch: string; rate: string }>;

type BrandConnection = {
  name: string;
  headline: string | null;
  openCampaigns: number;
  applied: number;
  accepted: number;
  offers: number;
  pendingOffers: number;
  latestCampaign: string;
  platforms: string[];
};

type CreatorProfileFormState = {
  firstName: string;
  lastName: string;
  headline: string;
  location: string;
  baseRate: string;
  engagementRate: string;
  averageViews: string;
  bio: string;
  niches: string;
  platformSpecialties: string;
  featuredBrands: string;
  featuredResult: string;
  audienceSummary: string;
  pastWork: string;
  portfolioUrl: string;
  instagramUrl: string;
  instagramHandle: string;
  instagramFollowers: string;
  tiktokUrl: string;
  tiktokHandle: string;
  tiktokFollowers: string;
  youtubeUrl: string;
  youtubeHandle: string;
  youtubeSubscribers: string;
  websiteUrl: string;
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
    offers: 1,
    pendingOffers: 1,
    latestCampaign: "Spring UGC Sprint",
    platforms: ["TikTok", "Instagram Reels"],
  },
  {
    name: "Pulse Studio",
    headline: "Mobile growth team",
    openCampaigns: 1,
    applied: 1,
    accepted: 1,
    offers: 0,
    pendingOffers: 0,
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

function formatListInput(values: string[] | null | undefined) {
  return (values ?? []).join(", ");
}

function parseListInput(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function sanitizeProfileValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formatMetricInput(value: number | null | undefined) {
  return value && value > 0 ? String(value) : "";
}

function parsePositiveMetric(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseWholeMetric(value: string) {
  return Math.round(parsePositiveMetric(value));
}

function buildCreatorProfileForm(
  profile: UserProfile,
  details: CreatorProfileDetails | null,
): CreatorProfileFormState {
  const nameParts = splitFullName(profile.full_name);

  return {
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    headline: profile.headline ?? "",
    location: details?.location ?? "",
    baseRate:
      details?.base_rate && details.base_rate > 0
        ? String(details.base_rate)
        : "",
    engagementRate: formatMetricInput(details?.engagement_rate),
    averageViews: formatMetricInput(details?.average_views),
    bio: details?.bio ?? "",
    niches: formatListInput(details?.niches),
    platformSpecialties: formatListInput(details?.platform_specialties),
    featuredBrands: formatListInput(details?.featured_brands),
    featuredResult: details?.featured_result ?? "",
    audienceSummary: details?.audience_summary ?? "",
    pastWork: details?.past_work ?? "",
    portfolioUrl: details?.portfolio_url ?? "",
    instagramUrl: details?.instagram_url ?? "",
    instagramHandle: details?.instagram_handle ?? "",
    instagramFollowers: formatMetricInput(details?.instagram_followers),
    tiktokUrl: details?.tiktok_url ?? "",
    tiktokHandle: details?.tiktok_handle ?? "",
    tiktokFollowers: formatMetricInput(details?.tiktok_followers),
    youtubeUrl: details?.youtube_url ?? "",
    youtubeHandle: details?.youtube_handle ?? "",
    youtubeSubscribers: formatMetricInput(details?.youtube_subscribers),
    websiteUrl: details?.website_url ?? "",
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
      offers: 0,
      pendingOffers: 0,
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
      offers: 0,
      pendingOffers: 0,
      latestCampaign: application.campaign_title,
      platforms: [],
    });
  }

  for (const invitation of data.invitations) {
    const existing = brands.get(invitation.brand_name);

    if (existing) {
      existing.offers += 1;
      existing.latestCampaign = invitation.campaign_title;
      existing.platforms = [
        ...new Set([...existing.platforms, ...invitation.platforms]),
      ];

      if (invitation.status === "pending") {
        existing.pendingOffers += 1;
      }

      continue;
    }

    brands.set(invitation.brand_name, {
      name: invitation.brand_name,
      headline: invitation.brand_headline,
      openCampaigns: invitation.status === "pending" ? 1 : 0,
      applied: 0,
      accepted: 0,
      offers: 1,
      pendingOffers: invitation.status === "pending" ? 1 : 0,
      latestCampaign: invitation.campaign_title,
      platforms: invitation.platforms,
    });
  }

  return [...brands.values()].sort((left, right) => {
    const priorityDelta =
      right.pendingOffers * 5 +
      right.accepted * 3 +
      right.applied -
      (left.pendingOffers * 5 + left.accepted * 3 + left.applied);

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

  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "shortlisted") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "revision_requested") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "pending") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "submitted") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "rejected" || status === "declined") {
    return "bg-rose-50 text-rose-700";
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
  return <WorkspacePanel className={className}>{children}</WorkspacePanel>;
}

export function CreatorWorkspace({
  profile,
  data,
  section,
  renderMode = "full",
}: CreatorWorkspaceProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(
    null,
  );
  const [drafts, setDrafts] = useState<DraftState>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<CreatorProfileFormState>(() =>
    buildCreatorProfileForm(profile, data.profile_details),
  );
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioFeedback, setPortfolioFeedback] = useState<string | null>(null);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const [pendingPortfolioRemovalId, setPendingPortfolioRemovalId] = useState<
    string | null
  >(null);
  const [isRefreshing, startRefresh] = useTransition();
  const [isSavingProfile, startProfileSave] = useTransition();
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const deferredQuery = useDeferredValue(searchQuery);
  const activeSection =
    creatorWorkspaceSections.find((item) => item.slug === section) ??
    creatorWorkspaceSections[0];
  const displayName = getDisplayName(
    [profileForm.firstName, profileForm.lastName].filter(Boolean).join(" ") ||
      profile.full_name,
    "Creator",
  );
  const brandConnections = useMemo(() => {
    const builtConnections = buildBrandConnections(data);
    return builtConnections.length ? builtConnections : fallbackBrands;
  }, [data]);
  const chatCandidates = useMemo(() => buildCreatorChatCandidates(data), [data]);
  const pendingInvitations = data.invitations.filter(
    (invitation) => invitation.status === "pending",
  );
  const acceptedApplications = data.applications.filter(
    (application) => application.status === "accepted",
  );
  const acceptedValue = data.applications
    .filter((application) => application.status === "accepted")
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
        campaign.product_name,
        campaign.product_details,
        campaign.content_type,
        campaign.creator_requirements,
        campaign.platforms.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [data.campaigns, deferredQuery]);

  useEffect(() => {
    setProfileForm(buildCreatorProfileForm(profile, data.profile_details));
  }, [data.profile_details, profile]);

  function updateProfileForm<Key extends keyof CreatorProfileFormState>(
    key: Key,
    value: CreatorProfileFormState[Key],
  ) {
    setProfileForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

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
    setIsSubmittingProfile(true);

    const supabase = createClient();
    const fullName = [profileForm.firstName.trim(), profileForm.lastName.trim()]
      .filter(Boolean)
      .join(" ");
    const baseRate = parsePositiveMetric(profileForm.baseRate);
    const engagementRate = parsePositiveMetric(profileForm.engagementRate);
    const averageViews = parseWholeMetric(profileForm.averageViews);
    const instagramFollowers = parseWholeMetric(profileForm.instagramFollowers);
    const tiktokFollowers = parseWholeMetric(profileForm.tiktokFollowers);
    const youtubeSubscribers = parseWholeMetric(profileForm.youtubeSubscribers);

    const [{ error: userError }, { error: creatorProfileError }] =
      await Promise.all([
        supabase
          .from("users")
          .update({
            full_name: fullName || null,
            headline: sanitizeProfileValue(profileForm.headline),
          })
          .eq("id", profile.id),
        supabase.from("creator_profiles").upsert(
          {
            user_id: profile.id,
            bio: sanitizeProfileValue(profileForm.bio),
            niches: parseListInput(profileForm.niches),
            platform_specialties: parseListInput(profileForm.platformSpecialties),
            portfolio_url: sanitizeProfileValue(profileForm.portfolioUrl),
            instagram_url: sanitizeProfileValue(profileForm.instagramUrl),
            instagram_handle: sanitizeProfileValue(profileForm.instagramHandle),
            instagram_followers: instagramFollowers,
            tiktok_url: sanitizeProfileValue(profileForm.tiktokUrl),
            tiktok_handle: sanitizeProfileValue(profileForm.tiktokHandle),
            tiktok_followers: tiktokFollowers,
            youtube_url: sanitizeProfileValue(profileForm.youtubeUrl),
            youtube_handle: sanitizeProfileValue(profileForm.youtubeHandle),
            youtube_subscribers: youtubeSubscribers,
            website_url: sanitizeProfileValue(profileForm.websiteUrl),
            base_rate: baseRate,
            engagement_rate: engagementRate,
            average_views: averageViews,
            featured_brands: parseListInput(profileForm.featuredBrands),
            featured_result: sanitizeProfileValue(profileForm.featuredResult),
            audience_summary: sanitizeProfileValue(profileForm.audienceSummary),
            past_work: sanitizeProfileValue(profileForm.pastWork),
            location: sanitizeProfileValue(profileForm.location),
          },
          {
            onConflict: "user_id",
          },
        ),
      ]);

    if (userError || creatorProfileError) {
      setProfileFeedback(
        [userError?.message, creatorProfileError?.message]
          .filter(Boolean)
          .join(" "),
      );
      setIsSubmittingProfile(false);
      return;
    }

    setProfileFeedback("Profile updated successfully.");
    setIsSubmittingProfile(false);
    startProfileSave(() => {
      router.refresh();
    });
  }

  async function handlePortfolioUpload() {
    if (!portfolioFiles.length) {
      setPortfolioFeedback("Choose at least one image or video sample to upload.");
      return;
    }

    setPortfolioFeedback(null);
    setIsUploadingPortfolio(true);

    const formData = new FormData();

    for (const file of portfolioFiles) {
      formData.append("files", file);
    }

    const response = await fetch("/api/creator-profile/assets", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setPortfolioFeedback(result?.error ?? "Unable to upload portfolio assets.");
      setIsUploadingPortfolio(false);
      return;
    }

    setPortfolioFiles([]);
    setPortfolioFeedback("Portfolio updated. Refreshing samples...");
    setIsUploadingPortfolio(false);
    startRefresh(() => {
      router.refresh();
    });
  }

  async function handlePortfolioRemove(asset: CreatorPortfolioAsset) {
    setPortfolioFeedback(null);
    setPendingPortfolioRemovalId(asset.id);

    const response = await fetch(`/api/creator-profile/assets/${asset.id}`, {
      method: "DELETE",
    });

    const result = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setPortfolioFeedback(result?.error ?? "Unable to remove sample.");
      setPendingPortfolioRemovalId(null);
      return;
    }

    setPortfolioFeedback("Sample removed. Refreshing portfolio...");
    setPendingPortfolioRemovalId(null);
    startRefresh(() => {
      router.refresh();
    });
  }

  function renderHomeSection() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            {
              label: "Open campaigns",
              value: String(data.campaigns.length),
            },
            {
              label: "Pending invites",
              value: String(pendingInvitations.length),
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

        {data.invitations.length ? (
          <SectionPanel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
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
                <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
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
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[1.25rem] border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                              Product
                            </p>
                            <p className="mt-2 font-semibold text-slate-950">
                              {campaign.product_name || "Shared in brief"}
                            </p>
                          </div>
                          <div className="rounded-[1.25rem] border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                              Content type
                            </p>
                            <p className="mt-2 font-semibold text-slate-950">
                              {campaign.content_type}
                            </p>
                          </div>
                        </div>
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
                          {campaign.deadline ? (
                            <p className="mt-1">Due {formatDate(campaign.deadline)}</p>
                          ) : null}
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
                      <div className="mt-6 grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
      <div className="space-y-6">
        {data.invitations.length ? (
          <SectionPanel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                  Current Offers
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Pending and completed invitation responses from brands.
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
                    {brand.pendingOffers > 0
                      ? `${brand.pendingOffers} offer${brand.pendingOffers === 1 ? "" : "s"}`
                      : `${brand.applied} applied`}
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-4 gap-3">
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
                      Offers
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {brand.offers}
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
      </div>
    );
  }

  function renderChatSection() {
    return <RealtimeChatPanel profile={profile} role="creator" candidates={chatCandidates} />;
  }

  function renderPayoutsSection() {
    return <CreatorPayoutsPanel profile={profile} payouts={data.payouts} />;
  }

  function renderProfileSection() {
    const profileBusy = isSubmittingProfile || isSavingProfile;
    const combinedAudience =
      parsePositiveMetric(profileForm.instagramFollowers) +
      parsePositiveMetric(profileForm.tiktokFollowers) +
      parsePositiveMetric(profileForm.youtubeSubscribers);
    const featuredBrands = parseListInput(profileForm.featuredBrands);
    const profileHighlights = [
      {
        label: "Combined audience",
        value: combinedAudience > 0 ? formatCompactNumber(combinedAudience) : "Add stats",
      },
      {
        label: "Engagement rate",
        value:
          parsePositiveMetric(profileForm.engagementRate) > 0
            ? formatPercent(parsePositiveMetric(profileForm.engagementRate))
            : "Add %",
      },
      {
        label: "Avg. views",
        value:
          parsePositiveMetric(profileForm.averageViews) > 0
            ? formatCompactNumber(parsePositiveMetric(profileForm.averageViews))
            : "Add views",
      },
      {
        label: "Featured brands",
        value: featuredBrands.length ? String(featuredBrands.length) : "Add proof",
      },
    ];

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
                Build the profile brands will actually search and filter against.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {profileHighlights.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-950">
                  {item.value}
                </p>
              </div>
            ))}
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
                  value={profileForm.firstName}
                  onChange={(event) =>
                    updateProfileForm("firstName", event.target.value)
                  }
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
                  value={profileForm.lastName}
                  onChange={(event) =>
                    updateProfileForm("lastName", event.target.value)
                  }
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
                value={profileForm.headline}
                onChange={(event) =>
                  updateProfileForm("headline", event.target.value)
                }
                placeholder="Beauty and lifestyle UGC creator"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="creator-location"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Location
                </label>
                <input
                  id="creator-location"
                  value={profileForm.location}
                  onChange={(event) =>
                    updateProfileForm("location", event.target.value)
                  }
                  placeholder="New York, USA"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div>
                <label
                  htmlFor="creator-base-rate"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Base Rate
                </label>
                <input
                  id="creator-base-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={profileForm.baseRate}
                  onChange={(event) =>
                    updateProfileForm("baseRate", event.target.value)
                  }
                  placeholder="750"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label
                  htmlFor="creator-engagement-rate"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Engagement Rate (%)
                </label>
                <input
                  id="creator-engagement-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={profileForm.engagementRate}
                  onChange={(event) =>
                    updateProfileForm("engagementRate", event.target.value)
                  }
                  placeholder="4.6"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div>
                <label
                  htmlFor="creator-average-views"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Average Views
                </label>
                <input
                  id="creator-average-views"
                  type="number"
                  min="0"
                  step="1"
                  value={profileForm.averageViews}
                  onChange={(event) =>
                    updateProfileForm("averageViews", event.target.value)
                  }
                  placeholder="18500"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div className="xl:col-span-2">
                <label
                  htmlFor="creator-featured-brands"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Featured Brands
                </label>
                <input
                  id="creator-featured-brands"
                  value={profileForm.featuredBrands}
                  onChange={(event) =>
                    updateProfileForm("featuredBrands", event.target.value)
                  }
                  placeholder="Rhode, Nike, Notion"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <p className="mt-2 text-sm text-slate-400">
                  Add brand names you have worked with, separated by commas.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="creator-bio"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Short Bio
              </label>
              <textarea
                id="creator-bio"
                rows={4}
                value={profileForm.bio}
                onChange={(event) => updateProfileForm("bio", event.target.value)}
                placeholder="Tell brands how you create, what kind of products you perform best with, and what makes your content convert."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="creator-niches"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Niches
                </label>
                <input
                  id="creator-niches"
                  value={profileForm.niches}
                  onChange={(event) =>
                    updateProfileForm("niches", event.target.value)
                  }
                  placeholder="Beauty, Skincare, Lifestyle"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <p className="mt-2 text-sm text-slate-400">
                  Separate each niche with a comma.
                </p>
              </div>
              <div>
                <label
                  htmlFor="creator-platform-specialties"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Platform Specialties
                </label>
                <input
                  id="creator-platform-specialties"
                  value={profileForm.platformSpecialties}
                  onChange={(event) =>
                    updateProfileForm("platformSpecialties", event.target.value)
                  }
                  placeholder="TikTok, Instagram Reels, YouTube Shorts"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <p className="mt-2 text-sm text-slate-400">
                  These power brand-side discovery filters.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="creator-audience-summary"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Audience Summary
                </label>
                <textarea
                  id="creator-audience-summary"
                  rows={4}
                  value={profileForm.audienceSummary}
                  onChange={(event) =>
                    updateProfileForm("audienceSummary", event.target.value)
                  }
                  placeholder="Share audience demographics, conversion strengths, or why your content performs."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div>
                <label
                  htmlFor="creator-past-work"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Past Work
                </label>
                <textarea
                  id="creator-past-work"
                  rows={4}
                  value={profileForm.pastWork}
                  onChange={(event) =>
                    updateProfileForm("pastWork", event.target.value)
                  }
                  placeholder="Mention notable brand work, vertical expertise, or results you can reference."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="creator-featured-result"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Featured Result
              </label>
              <textarea
                id="creator-featured-result"
                rows={3}
                value={profileForm.featuredResult}
                onChange={(event) =>
                  updateProfileForm("featuredResult", event.target.value)
                }
                placeholder="Example: Drove a 3.8x ROAS for a skincare launch with three creator-style product demos."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600">Portfolio and Social Links</p>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <input
                  type="url"
                  value={profileForm.portfolioUrl}
                  onChange={(event) =>
                    updateProfileForm("portfolioUrl", event.target.value)
                  }
                  placeholder="Portfolio URL"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <input
                  type="url"
                  value={profileForm.websiteUrl}
                  onChange={(event) =>
                    updateProfileForm("websiteUrl", event.target.value)
                  }
                  placeholder="Website URL"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <input
                  value={profileForm.instagramHandle}
                  onChange={(event) =>
                    updateProfileForm("instagramHandle", event.target.value)
                  }
                  placeholder="Instagram handle"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={profileForm.instagramFollowers}
                  onChange={(event) =>
                    updateProfileForm("instagramFollowers", event.target.value)
                  }
                  placeholder="Instagram followers"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <input
                  type="url"
                  value={profileForm.instagramUrl}
                  onChange={(event) =>
                    updateProfileForm("instagramUrl", event.target.value)
                  }
                  placeholder="Instagram profile URL"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <input
                  type="url"
                  value={profileForm.tiktokUrl}
                  onChange={(event) =>
                    updateProfileForm("tiktokUrl", event.target.value)
                  }
                  placeholder="TikTok profile URL"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <input
                  value={profileForm.tiktokHandle}
                  onChange={(event) =>
                    updateProfileForm("tiktokHandle", event.target.value)
                  }
                  placeholder="TikTok handle"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={profileForm.tiktokFollowers}
                  onChange={(event) =>
                    updateProfileForm("tiktokFollowers", event.target.value)
                  }
                  placeholder="TikTok followers"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <input
                  type="url"
                  value={profileForm.youtubeUrl}
                  onChange={(event) =>
                    updateProfileForm("youtubeUrl", event.target.value)
                  }
                  placeholder="YouTube channel URL"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <input
                  value={profileForm.youtubeHandle}
                  onChange={(event) =>
                    updateProfileForm("youtubeHandle", event.target.value)
                  }
                  placeholder="YouTube handle"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={profileForm.youtubeSubscribers}
                  onChange={(event) =>
                    updateProfileForm("youtubeSubscribers", event.target.value)
                  }
                  placeholder="YouTube subscribers"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <MotionScale
                type="submit"
                disabled={profileBusy}
                className="inline-flex h-14 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-8 text-base font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileBusy ? "Saving..." : "Save Changes"}
              </MotionScale>
              {profileFeedback ? (
                <p className="text-sm text-slate-500">{profileFeedback}</p>
              ) : null}
            </div>
          </form>

          <div className="mt-10 border-t border-slate-200 pt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">
                  Portfolio Samples
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Upload the creator content brands should see first in discovery.
                  These samples appear directly in the brand directory.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                {data.profile_assets.length} / 12 samples
              </span>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex-1">
                  <label
                    htmlFor="creator-portfolio-files"
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    Add image or video samples
                  </label>
                  <input
                    id="creator-portfolio-files"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(event) =>
                      setPortfolioFiles(
                        Array.from(event.target.files ?? []).filter(
                          (file) => file.size > 0,
                        ),
                      )
                    }
                    className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-3 file:text-sm file:font-semibold file:text-slate-700"
                  />
                  <p className="mt-2 text-sm text-slate-400">
                    Up to 12 total samples. Max 25 MB each.
                  </p>
                </div>
                <MotionScale
                  type="button"
                  onClick={() => void handlePortfolioUpload()}
                  disabled={
                    isUploadingPortfolio ||
                    !portfolioFiles.length ||
                    data.profile_assets.length >= 12
                  }
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-6 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploadingPortfolio ? "Uploading..." : "Upload samples"}
                </MotionScale>
              </div>

              {portfolioFiles.length ? (
                <div className="mt-5 grid gap-2 md:grid-cols-2">
                  {portfolioFiles.map((file) => (
                    <div
                      key={`${file.name}-${file.size}`}
                      className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-slate-600"
                    >
                      <span className="truncate pr-3 font-medium text-slate-900">
                        {file.name}
                      </span>
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {portfolioFeedback ? (
                <p className="mt-4 text-sm text-slate-500">{portfolioFeedback}</p>
              ) : null}
            </div>

            <div className="mt-6">
              <CreatorPortfolioGallery
                assets={data.profile_assets}
                emptyLabel="No samples uploaded yet. Add portfolio content brands can review."
                onRemove={(asset) => void handlePortfolioRemove(asset)}
                removingAssetId={pendingPortfolioRemovalId}
              />
            </div>
          </div>
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

  const navGroups: WorkspaceNavGroup[] = [
    {
      items: creatorWorkspaceSections.map((item) => {
        const Icon = sectionIcons[item.slug];

        return {
          href: getCreatorWorkspaceHref(item.slug),
          label: item.label,
          active: item.slug === section,
          icon: <Icon className="h-5 w-5" />,
          badge:
            item.slug === "my-brands" && pendingInvitations.length > 0
              ? String(pendingInvitations.length)
              : null,
        };
      }),
    },
  ];
  const creatorName = getDisplayName(profileForm.firstName, displayName);
  const heroTitle =
    section === "profile" ? "Profile settings." : section === "home"
      ? `Welcome back, ${creatorName}.`
      : activeSection.label;
  const heroDescription =
    section === "home"
      ? "Browse new briefs, keep applications moving, and stay close to the brands that match your style."
      : activeSection.description;
  const headerActions = (
    <>
      <span
        className={cn(
          "rounded-full px-4 py-2 text-sm font-semibold",
          pendingInvitations.length
            ? "bg-amber-50 text-amber-700"
            : "bg-emerald-50 text-emerald-700",
        )}
      >
        {pendingInvitations.length
          ? `${pendingInvitations.length} invites waiting`
          : "Inbox caught up"}
      </span>
      <NotificationsCenter profile={profile} />
      <SignOutButton variant="light" />
    </>
  );
  const topBanner = (
    <WorkspacePanel className="bg-[linear-gradient(135deg,_rgba(244,114,182,0.08),_rgba(255,255,255,0.92),_rgba(14,165,233,0.08))]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
            Momentum
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {pendingInvitations.length
              ? "Brand invites are waiting for your response."
              : acceptedApplications.length
                ? "Keep active deliveries tight so brands come back faster."
                : "Your next campaign is one polished profile away."}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            {pendingInvitations.length
              ? `${pendingInvitations.length} direct offers are pending. Review them quickly to keep yourself top of mind with brands moving fast.`
              : acceptedApplications.length
                ? `${acceptedApplications.length} accepted campaigns are in motion. Keep submissions and messages current so approvals do not stall.`
                : "Update your proof, audience signals, and past work so better-fit campaigns convert faster when brands review creators."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Polish profile
          </Link>
          <Link
            href="/dashboard/payouts"
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            View payouts
          </Link>
        </div>
      </div>
    </WorkspacePanel>
  );
  const sidebarFooter = (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(254,242,242,0.9))] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="absolute -right-8 top-0 h-20 w-20 rounded-full bg-[radial-gradient(circle,_rgba(244,114,182,0.18),_transparent_70%)]" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Next move
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          {data.profile_assets.length > 0
            ? `${data.profile_assets.length} samples live`
            : "Upload portfolio proof"}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Fresh samples and clear audience data help brands trust your fit before they ever message you.
        </p>
        <Link
          href="/dashboard/profile"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-slate-50"
        >
          Open profile
        </Link>
      </div>
    </div>
  );

  const content = renderSectionContent();

  if (renderMode === "content") {
    return (
      <WorkspaceMainContent
        tone="creator"
        eyebrow={section === "home" ? "Creator workspace" : "Creator studio"}
        title={heroTitle}
        description={heroDescription}
        metaItems={[
          {
            label: "Open campaigns",
            value: String(data.campaigns.length),
          },
          {
            label: "Pending invites",
            value: String(pendingInvitations.length),
          },
          {
            label: "Accepted pipeline",
            value: formatCompactCurrency(acceptedValue || 0),
          },
        ]}
        topBanner={topBanner}
        headerActions={headerActions}
      >
        {content}
      </WorkspaceMainContent>
    );
  }

  return (
    <WorkspaceShell
      tone="creator"
      displayName={displayName}
      roleLabel="Creator studio"
      initials={getInitials(displayName)}
      eyebrow={section === "home" ? "Creator workspace" : "Creator studio"}
      title={heroTitle}
      description={heroDescription}
      navGroups={navGroups}
      metaItems={[
        {
          label: "Open campaigns",
          value: String(data.campaigns.length),
        },
        {
          label: "Pending invites",
          value: String(pendingInvitations.length),
        },
        {
          label: "Accepted pipeline",
          value: formatCompactCurrency(acceptedValue || 0),
        },
      ]}
      topBanner={topBanner}
      headerActions={headerActions}
      sidebarFooter={sidebarFooter}
    >
      {content}
    </WorkspaceShell>
  );
}

export function CreatorWorkspaceChrome({
  profile,
  data,
  section,
  children,
}: CreatorWorkspaceChromeProps) {
  const pendingInvitations = data.invitations.filter(
    (invitation) => invitation.status === "pending",
  );
  const navGroups: WorkspaceNavGroup[] = [
    {
      items: creatorWorkspaceSections.map((item) => {
        const Icon = sectionIcons[item.slug];

        return {
          href: getCreatorWorkspaceHref(item.slug),
          label: item.label,
          active: item.slug === section,
          icon: <Icon className="h-5 w-5" />,
          badge:
            item.slug === "my-brands" && pendingInvitations.length > 0
              ? String(pendingInvitations.length)
              : null,
        };
      }),
    },
  ];
  const displayName = getDisplayName(profile.full_name, "Creator");
  const userName= profile?.full_name;
  const sidebarFooter = (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(254,242,242,0.9))] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="absolute -right-8 top-0 h-20 w-20 rounded-full bg-[radial-gradient(circle,_rgba(244,114,182,0.18),_transparent_70%)]" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Next move
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          {data.profile_assets.length > 0
            ? `${data.profile_assets.length} samples live`
            : "Upload portfolio proof"}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Fresh samples and clear audience data help brands trust your fit before they ever message you.
        </p>
        <Link
          href="/dashboard/profile"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-slate-50"
        >
          Open profile
        </Link>
      </div>
    </div>
  );

  return (
    <WorkspaceViewport tone="creator" name={userName} roleLabel="Creator studio">
      <WorkspaceSidebar
        tone="creator"
        displayName={displayName}
        roleLabel="Creator studio"
        initials={getInitials(displayName)}
        navGroups={navGroups}
        sidebarFooter={sidebarFooter}
      />
      <div className="min-w-0">{children}</div>
    </WorkspaceViewport>
  );
}
