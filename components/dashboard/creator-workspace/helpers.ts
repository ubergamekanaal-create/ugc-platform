import type { CreatorDashboardData, CreatorProfileDetails, UserProfile } from "@/lib/types";
import type { BrandConnection, CreatorProfileFormState } from "./types";

export const fallbackBrands: BrandConnection[] = [
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

export function splitFullName(value?: string | null) {
  const parts = (value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function formatListInput(values: string[] | null | undefined) {
  return (values ?? []).join(", ");
}

export function parseListInput(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function sanitizeProfileValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function formatMetricInput(value: number | null | undefined) {
  return value && value > 0 ? String(value) : "";
}

export function parsePositiveMetric(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function parseWholeMetric(value: string) {
  return Math.round(parsePositiveMetric(value));
}

export function buildCreatorProfileForm(
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

export function buildBrandConnections(data: CreatorDashboardData) {
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

export function getStatusClasses(status: string) {
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

