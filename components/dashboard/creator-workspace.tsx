"use client";

import Link from "next/link";
import {
  type FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { NotificationsCenter } from "@/components/dashboard/notifications-center";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import {
  WorkspaceMainContent,
  WorkspaceShell,
  WorkspacePanel,
  type WorkspaceNavGroup,
} from "@/components/dashboard/workspace-shell";
import { buildCreatorChatCandidates } from "@/lib/chat/candidates";
import {
  creatorWorkspaceSections,
  getCreatorWorkspaceHref,
} from "@/lib/creator-workspace";
import { createClient } from "@/lib/supabase/client";
import type { CreatorPortfolioAsset } from "@/lib/types";
import {
  cn,
  formatCompactCurrency,
  getDisplayName,
  getInitials,
} from "@/lib/utils";
import { CreatorWorkspaceBrandsSection } from "./creator-workspace/brands-section";
import { CreatorWorkspaceChatSection } from "./creator-workspace/chat-section";
import { CreatorWorkspaceHomeSection } from "./creator-workspace/home-section";
import { sectionIcons } from "./creator-workspace/icons";
import { CreatorWorkspacePayoutsSection } from "./creator-workspace/payouts-section";
import { CreatorWorkspaceProfileSection } from "./creator-workspace/profile-section";
import {
  buildBrandConnections,
  buildCreatorProfileForm,
  fallbackBrands,
  parseListInput,
  parsePositiveMetric,
  parseWholeMetric,
  sanitizeProfileValue,
} from "./creator-workspace/helpers";
import type {
  CreatorProfileFormState,
  CreatorWorkspaceProps,
  CreatorWorkspaceSectionContext,
  DraftState,
} from "./creator-workspace/types";

export { CreatorWorkspaceChrome } from "./creator-workspace/chrome";

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
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(
    null,
  );
  const [profileForm, setProfileForm] = useState<CreatorProfileFormState>(() =>
    buildCreatorProfileForm(profile, data.profile_details),
  );
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioFeedback, setPortfolioFeedback] = useState<string | null>(
    null,
  );
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
  const chatCandidates = useMemo(
    () => buildCreatorChatCandidates(data),
    [data],
  );
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
            platform_specialties: parseListInput(
              profileForm.platformSpecialties,
            ),
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
      setPortfolioFeedback(
        "Choose at least one image or video sample to upload.",
      );
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

    const result = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      setPortfolioFeedback(
        result?.error ?? "Unable to upload portfolio assets.",
      );
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

    const result = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

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

  const sectionContext: CreatorWorkspaceSectionContext = {
    profile,
    data,
    displayName,
    searchQuery,
    setSearchQuery,
    expandedCampaignId,
    setExpandedCampaignId,
    drafts,
    setDrafts,
    feedback,
    pendingCampaignId,
    profileForm,
    updateProfileForm,
    profileFeedback,
    portfolioFiles,
    setPortfolioFiles,
    portfolioFeedback,
    isUploadingPortfolio,
    pendingPortfolioRemovalId,
    isRefreshing,
    isSavingProfile,
    isSubmittingProfile,
    brandConnections,
    chatCandidates,
    pendingInvitations,
    acceptedApplications,
    acceptedValue,
    filteredCampaigns,
    handleApply,
    handleProfileSave,
    handlePortfolioUpload,
    handlePortfolioRemove,
  };

  function renderSectionContent() {
    switch (section) {
      case "home":
        return <CreatorWorkspaceHomeSection ctx={sectionContext} />;
      case "my-brands":
        return <CreatorWorkspaceBrandsSection ctx={sectionContext} />;
      case "chat":
        return <CreatorWorkspaceChatSection ctx={sectionContext} />;
      case "payouts":
        return <CreatorWorkspacePayoutsSection ctx={sectionContext} />;
      case "profile":
        return <CreatorWorkspaceProfileSection ctx={sectionContext} />;
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
    section === "profile"
      ? "Profile settings."
      : section === "home"
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
    <div className="mx-2 relative overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(254,242,242,0.9))] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
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
          Fresh samples and clear audience data help brands trust your fit
          before they ever message you.
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
      <div
        className={cn(
          section === "chat" && "h-[calc(100vh-16rem)] min-h-[640px]",
        )}
      >
        {content}
      </div>
    </WorkspaceShell>
  );
}
