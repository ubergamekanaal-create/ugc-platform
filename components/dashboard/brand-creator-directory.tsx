"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreatorPortfolioGallery } from "@/components/dashboard/creator-portfolio-gallery";
import { createClient } from "@/lib/supabase/client";
import type {
  BrandCampaignSummary,
  BrandCreatorDirectoryEntry,
} from "@/lib/types";
import {
  cn,
  formatCompactCurrency,
  formatCompactNumber,
  formatDate,
  formatPercent,
  getInitials,
} from "@/lib/utils";

type BrandCreatorDirectoryProps = {
  brandId: string;
  campaigns: BrandCampaignSummary[];
  creators: BrandCreatorDirectoryEntry[];
  preferredCampaignId?: string | null;
};

type CollaborationFilter =
  | "all"
  | "available"
  | "pending_invites"
  | "past_collaborators";

type RateFilter = "all" | "under_1000" | "between_1000_2500" | "above_2500";

type AudienceFilter =
  | "all"
  | "under_10000"
  | "between_10000_50000"
  | "above_50000";

type PerformanceFilter =
  | "all"
  | "engagement_3_plus"
  | "engagement_5_plus"
  | "views_10000_plus";

function getDefaultCampaignId(
  creator: BrandCreatorDirectoryEntry,
  campaigns: BrandCampaignSummary[],
  preferredCampaignId?: string | null,
) {
  if (
    preferredCampaignId &&
    campaigns.some(
      (campaign) =>
        campaign.id === preferredCampaignId &&
        !creator.invited_campaign_ids.includes(campaign.id),
    )
  ) {
    return preferredCampaignId;
  }

  return (
    campaigns.find((campaign) => !creator.invited_campaign_ids.includes(campaign.id))
      ?.id ?? ""
  );
}

function getDiscoveryRate(creator: BrandCreatorDirectoryEntry) {
  return Math.max(creator.base_rate, creator.rate);
}

function getCreatorAudienceReach(creator: BrandCreatorDirectoryEntry) {
  return Math.max(
    creator.instagram_followers,
    creator.tiktok_followers,
    creator.youtube_subscribers,
  );
}

function getCreatorCombinedAudience(creator: BrandCreatorDirectoryEntry) {
  return (
    creator.instagram_followers +
    creator.tiktok_followers +
    creator.youtube_subscribers
  );
}

function getCreatorLinks(creator: BrandCreatorDirectoryEntry) {
  return [
    { label: "Portfolio", href: creator.portfolio_url },
    { label: "Website", href: creator.website_url },
    {
      label: creator.instagram_handle
        ? `Instagram @${creator.instagram_handle}`
        : "Instagram",
      href: creator.instagram_url,
    },
    {
      label: creator.tiktok_handle ? `TikTok @${creator.tiktok_handle}` : "TikTok",
      href: creator.tiktok_url,
    },
    {
      label: creator.youtube_handle
        ? `YouTube @${creator.youtube_handle}`
        : "YouTube",
      href: creator.youtube_url,
    },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));
}

function matchesRateFilter(
  creator: BrandCreatorDirectoryEntry,
  rateFilter: RateFilter,
) {
  const rate = getDiscoveryRate(creator);

  if (rateFilter === "under_1000") {
    return rate > 0 && rate < 1000;
  }

  if (rateFilter === "between_1000_2500") {
    return rate >= 1000 && rate <= 2500;
  }

  if (rateFilter === "above_2500") {
    return rate > 2500;
  }

  return true;
}

function matchesCollaborationFilter(
  creator: BrandCreatorDirectoryEntry,
  filter: CollaborationFilter,
) {
  if (filter === "available") {
    return creator.pending_invitations === 0;
  }

  if (filter === "pending_invites") {
    return creator.pending_invitations > 0;
  }

  if (filter === "past_collaborators") {
    return creator.accepted > 0 || creator.applications > 0;
  }

  return true;
}

function matchesAudienceFilter(
  creator: BrandCreatorDirectoryEntry,
  filter: AudienceFilter,
) {
  const reach = getCreatorAudienceReach(creator);

  if (filter === "under_10000") {
    return reach > 0 && reach < 10000;
  }

  if (filter === "between_10000_50000") {
    return reach >= 10000 && reach <= 50000;
  }

  if (filter === "above_50000") {
    return reach > 50000;
  }

  return true;
}

function matchesPerformanceFilter(
  creator: BrandCreatorDirectoryEntry,
  filter: PerformanceFilter,
) {
  if (filter === "engagement_3_plus") {
    return creator.engagement_rate >= 3;
  }

  if (filter === "engagement_5_plus") {
    return creator.engagement_rate >= 5;
  }

  if (filter === "views_10000_plus") {
    return creator.average_views >= 10000;
  }

  return true;
}

export function BrandCreatorDirectory({
  brandId,
  campaigns,
  creators,
  preferredCampaignId = null,
}: BrandCreatorDirectoryProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedRate, setSelectedRate] = useState<RateFilter>("all");
  const [selectedAudience, setSelectedAudience] =
    useState<AudienceFilter>("all");
  const [selectedPerformance, setSelectedPerformance] =
    useState<PerformanceFilter>("all");
  const [selectedCollaboration, setSelectedCollaboration] =
    useState<CollaborationFilter>("all");
  const [selectedCampaigns, setSelectedCampaigns] = useState<Record<string, string>>(
    {},
  );
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [offeredRates, setOfferedRates] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [pendingCreatorId, setPendingCreatorId] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const deferredQuery = useDeferredValue(searchQuery);

  const inviteableCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.status !== "completed"),
    [campaigns],
  );
  const nicheOptions = useMemo(
    () =>
      [...new Set(creators.flatMap((creator) => creator.niches))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [creators],
  );
  const platformOptions = useMemo(
    () =>
      [...new Set(creators.flatMap((creator) => creator.platform_specialties))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [creators],
  );
  const filteredCreators = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return creators.filter((creator) => {
      if (
        selectedNiche !== "all" &&
        !creator.niches.some((niche) => niche === selectedNiche)
      ) {
        return false;
      }

      if (
        selectedPlatform !== "all" &&
        !creator.platform_specialties.some(
          (platform) => platform === selectedPlatform,
        )
      ) {
        return false;
      }

      if (!matchesRateFilter(creator, selectedRate)) {
        return false;
      }

      if (!matchesAudienceFilter(creator, selectedAudience)) {
        return false;
      }

      if (!matchesPerformanceFilter(creator, selectedPerformance)) {
        return false;
      }

      if (!matchesCollaborationFilter(creator, selectedCollaboration)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        creator.name,
        creator.headline,
        creator.focus,
        creator.bio,
        creator.location,
        creator.audience_summary,
        creator.past_work,
        creator.featured_result,
        creator.featured_brands.join(" "),
        creator.instagram_handle,
        creator.tiktok_handle,
        creator.youtube_handle,
        creator.niches.join(" "),
        creator.platform_specialties.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [
    creators,
    deferredQuery,
    selectedAudience,
    selectedCollaboration,
    selectedNiche,
    selectedPlatform,
    selectedPerformance,
    selectedRate,
  ]);

  async function handleInvite(creator: BrandCreatorDirectoryEntry) {
    const campaignId =
      selectedCampaigns[creator.id] ||
      getDefaultCampaignId(creator, inviteableCampaigns, preferredCampaignId);

    if (!campaignId) {
      setFeedback((current) => ({
        ...current,
        [creator.id]: "Create a campaign before sending invites.",
      }));
      return;
    }

    setPendingCreatorId(creator.id);
    setFeedback((current) => ({ ...current, [creator.id]: "" }));

    const supabase = createClient();
    const { error } = await supabase.from("campaign_invitations").upsert(
      {
        brand_id: brandId,
        creator_id: creator.id,
        campaign_id: campaignId,
        message: messages[creator.id]?.trim() || null,
        offered_rate: Number(offeredRates[creator.id] || 0),
        status: "pending",
      },
      {
        onConflict: "campaign_id,creator_id",
      },
    );

    if (error) {
      setFeedback((current) => ({
        ...current,
        [creator.id]: error.message,
      }));
      setPendingCreatorId(null);
      return;
    }

    setMessages((current) => ({ ...current, [creator.id]: "" }));
    setOfferedRates((current) => ({ ...current, [creator.id]: "" }));
    setFeedback((current) => ({
      ...current,
      [creator.id]: "Invitation sent. Refreshing roster...",
    }));
    setPendingCreatorId(null);
    startRefresh(() => {
      router.refresh();
    });
  }

  const hasActiveFilters =
    searchQuery.trim() ||
    selectedNiche !== "all" ||
    selectedPlatform !== "all" ||
    selectedRate !== "all" ||
    selectedAudience !== "all" ||
    selectedPerformance !== "all" ||
    selectedCollaboration !== "all";

  if (!creators.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        Creator profiles will appear here once creators finish setting up their
        CIRCL profile.
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">
              Creator Discovery
            </p>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-950">
              Search, filter, and invite the right creators
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Find creators by niche, platform fit, pricing, and collaboration
              history using real profile data from Supabase.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-600">
              {creators.length} total creators
            </span>
            <span className="rounded-full bg-blue-50 px-4 py-2 text-accent">
              {filteredCreators.length} matching filters
            </span>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-emerald-700">
              {
                creators.filter((creator) => creator.pending_invitations > 0).length
              }{" "}
              with pending invites
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, niche, bio, audience, or platform"
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)] xl:col-span-2"
          />
          <select
            value={selectedNiche}
            onChange={(event) => setSelectedNiche(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
          >
            <option value="all">All niches</option>
            {nicheOptions.map((niche) => (
              <option key={niche} value={niche}>
                {niche}
              </option>
            ))}
          </select>
          <select
            value={selectedPlatform}
            onChange={(event) => setSelectedPlatform(event.target.value)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
          >
            <option value="all">All platforms</option>
            {platformOptions.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
          <select
            value={selectedRate}
            onChange={(event) => setSelectedRate(event.target.value as RateFilter)}
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
          >
            <option value="all">All rates</option>
            <option value="under_1000">Under $1k</option>
            <option value="between_1000_2500">$1k to $2.5k</option>
            <option value="above_2500">$2.5k+</option>
          </select>
          <select
            value={selectedAudience}
            onChange={(event) =>
              setSelectedAudience(event.target.value as AudienceFilter)
            }
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
          >
            <option value="all">All audience sizes</option>
            <option value="under_10000">Under 10k</option>
            <option value="between_10000_50000">10k to 50k</option>
            <option value="above_50000">50k+</option>
          </select>
          <select
            value={selectedPerformance}
            onChange={(event) =>
              setSelectedPerformance(event.target.value as PerformanceFilter)
            }
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
          >
            <option value="all">All performance tiers</option>
            <option value="engagement_3_plus">3%+ engagement</option>
            <option value="engagement_5_plus">5%+ engagement</option>
            <option value="views_10000_plus">10k+ avg. views</option>
          </select>
          <select
            value={selectedCollaboration}
            onChange={(event) =>
              setSelectedCollaboration(event.target.value as CollaborationFilter)
            }
            className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
          >
            <option value="all">All collaboration states</option>
            <option value="available">Ready to invite</option>
            <option value="pending_invites">Pending invite sent</option>
            <option value="past_collaborators">Past collaborators</option>
          </select>
        </div>

        {hasActiveFilters ? (
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Narrowing results with live profile filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedNiche("all");
                setSelectedPlatform("all");
                setSelectedRate("all");
                setSelectedAudience("all");
                setSelectedPerformance("all");
                setSelectedCollaboration("all");
              }}
              className="text-sm font-medium text-accent transition hover:text-blue-500"
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </div>

      {!filteredCreators.length ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          No creators match the current filter set. Try broadening the niche,
          platform, or rate filters.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-2">
        {filteredCreators.map((creator) => {
          const availableCampaigns = inviteableCampaigns.filter(
            (campaign) => !creator.invited_campaign_ids.includes(campaign.id),
          );
          const selectedCampaignId =
            selectedCampaigns[creator.id] ||
            getDefaultCampaignId(
              creator,
              inviteableCampaigns,
              preferredCampaignId,
            );
          const creatorLinks = getCreatorLinks(creator);
          const discoveryRate = getDiscoveryRate(creator);
          const audienceReach = getCreatorAudienceReach(creator);
          const combinedAudience = getCreatorCombinedAudience(creator);

          return (
            <div
              key={creator.id}
              className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-slate-900 text-sm font-semibold text-white">
                    {getInitials(creator.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-semibold text-slate-950">
                      {creator.name}
                    </p>
                    <p className="mt-1 break-words text-sm text-slate-500">
                      {creator.headline ?? creator.focus}
                    </p>
                    {creator.location ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                        {creator.location}
                      </p>
                    ) : null}
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-accent">
                  {creator.pending_invitations > 0
                    ? `${creator.pending_invitations} pending`
                    : creator.niches[0] ?? creator.focus}
                </span>
              </div>

              {creator.bio ? (
                <p className="mt-5 break-words text-sm leading-7 text-slate-600">
                  {creator.bio}
                </p>
              ) : (
                <p className="mt-5 break-words text-sm leading-7 text-slate-500">
                  This creator has not added a short bio yet.
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {(creator.niches.length ? creator.niches : [creator.focus]).map((item) => (
                  <span
                    key={`${creator.id}-niche-${item}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {item}
                  </span>
                ))}
                {creator.platform_specialties.map((platform) => (
                  <span
                    key={`${creator.id}-platform-${platform}`}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-accent"
                  >
                    {platform}
                  </span>
                ))}
              </div>

              {creator.featured_brands.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {creator.featured_brands.map((brand) => (
                    <span
                      key={`${creator.id}-brand-${brand}`}
                      className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-accent"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Reach
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {audienceReach > 0 ? formatCompactNumber(audienceReach) : "Add stats"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Avg. views
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {creator.average_views > 0
                      ? formatCompactNumber(creator.average_views)
                      : "Add views"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Engagement
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {creator.engagement_rate > 0
                      ? formatPercent(creator.engagement_rate)
                      : "Add %"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Rate
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {discoveryRate > 0
                      ? formatCompactCurrency(discoveryRate)
                      : "Open"}
                  </p>
                </div>
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
                    Invites
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {creator.invitations}
                  </p>
                </div>
              </div>

              {(combinedAudience > 0 ||
                creator.audience_summary ||
                creator.past_work ||
                creator.featured_result) && (
                <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-600">
                  {combinedAudience > 0 ? (
                    <p>
                      <span className="font-medium text-slate-900">
                        Combined audience:
                      </span>{" "}
                      {formatCompactNumber(combinedAudience)}
                    </p>
                  ) : null}
                  {creator.audience_summary ? (
                    <p className={cn(combinedAudience > 0 ? "mt-3" : "")}>
                      <span className="font-medium text-slate-900">Audience:</span>{" "}
                      {creator.audience_summary}
                    </p>
                  ) : null}
                  {creator.past_work ? (
                    <p
                      className={cn(
                        combinedAudience > 0 || creator.audience_summary ? "mt-3" : "",
                      )}
                    >
                      <span className="font-medium text-slate-900">Past work:</span>{" "}
                      {creator.past_work}
                    </p>
                  ) : null}
                  {creator.featured_result ? (
                    <p
                      className={cn(
                        combinedAudience > 0 ||
                          creator.audience_summary ||
                          creator.past_work
                          ? "mt-3"
                          : "",
                      )}
                    >
                      <span className="font-medium text-slate-900">
                        Featured result:
                      </span>{" "}
                      {creator.featured_result}
                    </p>
                  ) : null}
                </div>
              )}

              <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">
                  {creator.latest_campaign_title
                    ? `Latest campaign: ${creator.latest_campaign_title}`
                    : "No campaign applications or accepted work yet."}
                </p>
                <p className="mt-2">
                  {creator.last_invited_at
                    ? `Last invited ${formatDate(creator.last_invited_at)}`
                    : "Ready for a first outbound invite."}
                </p>
              </div>

              {creatorLinks.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {creatorLinks.map((link) => (
                    <a
                      key={`${creator.id}-${link.label}`}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-accent/30 hover:text-accent"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : null}

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Content Samples
                  </p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    {creator.portfolio_assets.length} sample
                    {creator.portfolio_assets.length === 1 ? "" : "s"}
                  </span>
                </div>
                <CreatorPortfolioGallery
                  assets={creator.portfolio_assets}
                  layout="strip"
                  limit={5}
                  emptyLabel="This creator has not uploaded portfolio content yet."
                />
              </div>

              <div className="mt-6 space-y-3">
                <div>
                  <label
                    htmlFor={`offer-rate-${creator.id}`}
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    Offer rate
                  </label>
                  <input
                    id={`offer-rate-${creator.id}`}
                    type="number"
                    min="0"
                    value={offeredRates[creator.id] ?? ""}
                    onChange={(event) =>
                      setOfferedRates((current) => ({
                        ...current,
                        [creator.id]: event.target.value,
                      }))
                    }
                    placeholder={discoveryRate > 0 ? String(discoveryRate) : "750"}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`campaign-${creator.id}`}
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    Invite to campaign
                  </label>
                  <select
                    id={`campaign-${creator.id}`}
                    value={selectedCampaignId}
                    onChange={(event) =>
                      setSelectedCampaigns((current) => ({
                        ...current,
                        [creator.id]: event.target.value,
                      }))
                    }
                    disabled={!availableCampaigns.length}
                    className={cn(
                      "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]",
                      !availableCampaigns.length &&
                        "cursor-not-allowed bg-slate-100 text-slate-400",
                    )}
                  >
                    {availableCampaigns.length ? (
                      availableCampaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.title}
                        </option>
                      ))
                    ) : (
                      <option value="">Already invited to all campaigns</option>
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`message-${creator.id}`}
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    Invite note
                  </label>
                  <textarea
                    id={`message-${creator.id}`}
                    rows={3}
                    value={messages[creator.id] ?? ""}
                    onChange={(event) =>
                      setMessages((current) => ({
                        ...current,
                        [creator.id]: event.target.value,
                      }))
                    }
                    placeholder="Share the angle, target customer, creative direction, or delivery deadline."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleInvite(creator)}
                  disabled={pendingCreatorId === creator.id || !availableCampaigns.length}
                  className="flex-1 rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingCreatorId === creator.id ? "Sending..." : "Invite to campaign"}
                </button>
                <a
                  href={creator.portfolio_url ?? creator.website_url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold",
                    creator.portfolio_url || creator.website_url
                      ? "text-slate-600 transition hover:border-accent/30 hover:text-accent"
                      : "pointer-events-none text-slate-400",
                  )}
                >
                  Portfolio
                </a>
              </div>

              {feedback[creator.id] ? (
                <p className="mt-4 text-sm text-slate-500">{feedback[creator.id]}</p>
              ) : null}
            </div>
          );
        })}

        {isRefreshing ? (
          <div className="text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            Refreshing creator roster...
          </div>
        ) : null}
      </div>
    </div>
  );
}
