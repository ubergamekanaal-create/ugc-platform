import { createClient } from "@/lib/supabase/server";
import type {
  BrandApplicationSummary,
  BrandCampaignSummary,
  BrandDashboardData,
  Campaign,
  CampaignApplication,
  CreatorApplicationSummary,
  CreatorCampaignSummary,
  CreatorDashboardData,
  PublicProfile,
  Role,
  UserProfile,
} from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type DashboardContext =
  | {
      role: "brand";
      profile: UserProfile & { role: "brand" };
      data: BrandDashboardData;
    }
  | {
      role: "creator";
      profile: UserProfile & { role: "creator" };
      data: CreatorDashboardData;
    };

const brandCampaignFallback: Campaign[] = [
  {
    id: "demo-campaign-1",
    brand_id: "brand-demo",
    title: "Spring UGC Sprint",
    description:
      "Source short-form creator assets for a product launch across TikTok and Reels.",
    budget: 4500,
    status: "active",
    platforms: ["TikTok", "Instagram Reels"],
    deliverables: "3 videos, 6 hooks, raw footage handoff",
    creator_slots: 4,
    duration: "14 days",
    payment_type: "Fixed",
    created_at: "2026-03-18T10:00:00.000Z",
  },
  {
    id: "demo-campaign-2",
    brand_id: "brand-demo",
    title: "Creator Seeding Program",
    description:
      "Find niche beauty creators who can produce organic unboxing and testimonial content.",
    budget: 2600,
    status: "open",
    platforms: ["Instagram", "YouTube Shorts"],
    deliverables: "2 videos, 1 story set, usage rights",
    creator_slots: 6,
    duration: "21 days",
    payment_type: "Hybrid",
    created_at: "2026-03-21T14:30:00.000Z",
  },
];

const creatorCampaignFallback: Campaign[] = [
  {
    id: "market-campaign-1",
    brand_id: "brand-demo",
    title: "Premium Skincare Demo Content",
    description:
      "Shoot a clean, product-first walkthrough that feels native to creator-led skincare reviews.",
    budget: 1800,
    status: "open",
    platforms: ["TikTok", "Instagram Reels"],
    deliverables: "2 short-form videos + 5 stills",
    creator_slots: 3,
    duration: "10 days",
    payment_type: "Fixed",
    created_at: "2026-03-22T11:00:00.000Z",
  },
  {
    id: "market-campaign-2",
    brand_id: "brand-demo-2",
    title: "Fitness App Testimonial Series",
    description:
      "Create punchy, story-led hooks around workouts, progress, and app-specific value props.",
    budget: 2400,
    status: "open",
    platforms: ["TikTok", "YouTube Shorts"],
    deliverables: "3 videos, 1 voiceover option",
    creator_slots: 5,
    duration: "14 days",
    payment_type: "Performance bonus",
    created_at: "2026-03-23T09:45:00.000Z",
  },
  {
    id: "market-campaign-3",
    brand_id: "brand-demo-3",
    title: "Home Office Creator Pack",
    description:
      "Showcase a desk setup product line with premium framing, lifestyle context, and authentic talking points.",
    budget: 3200,
    status: "open",
    platforms: ["Instagram Reels", "Pinterest"],
    deliverables: "2 videos, 8 product photos",
    creator_slots: 4,
    duration: "18 days",
    payment_type: "Fixed",
    created_at: "2026-03-24T16:20:00.000Z",
  },
];

const applicationFallback: CampaignApplication[] = [
  {
    id: "application-demo-1",
    campaign_id: "demo-campaign-1",
    creator_id: "creator-demo",
    pitch:
      "I can deliver testimonial-led hooks and raw variations with a premium beauty style.",
    rate: 950,
    status: "shortlisted",
    created_at: "2026-03-20T08:00:00.000Z",
  },
  {
    id: "application-demo-2",
    campaign_id: "market-campaign-2",
    creator_id: "creator-demo",
    pitch:
      "I focus on high-retention fitness storytelling and can ship edits quickly.",
    rate: 1100,
    status: "pending",
    created_at: "2026-03-24T07:30:00.000Z",
  },
];

const publicProfileFallback: Record<string, PublicProfile> = {
  "brand-demo": {
    id: "brand-demo",
    role: "brand",
    display_name: "Northstar Labs",
    full_name: null,
    company_name: "Northstar Labs",
    headline: "UGC-focused product launches",
    avatar_url: null,
  },
  "brand-demo-2": {
    id: "brand-demo-2",
    role: "brand",
    display_name: "Pulse Studio",
    full_name: null,
    company_name: "Pulse Studio",
    headline: "Mobile growth team",
    avatar_url: null,
  },
  "brand-demo-3": {
    id: "brand-demo-3",
    role: "brand",
    display_name: "Cascade Home",
    full_name: null,
    company_name: "Cascade Home",
    headline: "Design-led consumer brand",
    avatar_url: null,
  },
  "creator-demo": {
    id: "creator-demo",
    role: "creator",
    display_name: "Riley Cole",
    full_name: "Riley Cole",
    company_name: null,
    headline: "Beauty and lifestyle UGC creator",
    avatar_url: null,
  },
};

function isRole(value: unknown): value is Role {
  return value === "brand" || value === "creator";
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }

  return fallback;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function normalizeProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: readString(row.id),
    email: readString(row.email),
    role: isRole(row.role) ? row.role : "creator",
    full_name: readNullableString(row.full_name),
    company_name: readNullableString(row.company_name),
    headline: readNullableString(row.headline),
    avatar_url: readNullableString(row.avatar_url),
    stripe_account_id: readNullableString(row.stripe_account_id),
    created_at: readNullableString(row.created_at),
  };
}

function normalizeCampaign(row: Record<string, unknown>): Campaign {
  return {
    id: readString(row.id),
    brand_id: readString(row.brand_id),
    title: readString(row.title),
    description: readString(row.description),
    budget: readNumber(row.budget),
    status:
      row.status === "in_review" ||
      row.status === "active" ||
      row.status === "completed"
        ? row.status
        : "open",
    platforms: readStringArray(row.platforms),
    deliverables: readString(row.deliverables),
    creator_slots: readNumber(row.creator_slots, 1),
    duration: readString(row.duration, "14 days"),
    payment_type: readString(row.payment_type, "Fixed"),
    created_at: readString(row.created_at, new Date().toISOString()),
  };
}

function normalizeApplication(row: Record<string, unknown>): CampaignApplication {
  return {
    id: readString(row.id),
    campaign_id: readString(row.campaign_id),
    creator_id: readString(row.creator_id),
    pitch: readString(row.pitch),
    rate: readNumber(row.rate),
    status:
      row.status === "shortlisted" ||
      row.status === "accepted" ||
      row.status === "declined"
        ? row.status
        : "pending",
    created_at: readString(row.created_at, new Date().toISOString()),
  };
}

async function getPublicProfiles(
  supabase: SupabaseServerClient,
  ids: string[],
) {
  if (!ids.length) {
    return new Map<string, PublicProfile>();
  }

  const uniqueIds = [...new Set(ids)];
  const { data, error } = await supabase
    .from("public_profiles")
    .select(
      "id, role, display_name, full_name, company_name, headline, avatar_url",
    )
    .in("id", uniqueIds);

  if (error || !data) {
    return new Map(
      uniqueIds
        .map((id) => publicProfileFallback[id])
        .filter(Boolean)
        .map((profile) => [profile.id, profile]),
    );
  }

  return new Map(
    (data as Array<Record<string, unknown>>).map((row) => [
      readString(row.id),
      {
        id: readString(row.id),
        role: isRole(row.role) ? row.role : "creator",
        display_name: readNullableString(row.display_name),
        full_name: readNullableString(row.full_name),
        company_name: readNullableString(row.company_name),
        headline: readNullableString(row.headline),
        avatar_url: readNullableString(row.avatar_url),
      } satisfies PublicProfile,
    ]),
  );
}

async function getBrandData(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<BrandDashboardData> {
  const { data: rawCampaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select(
      "id, brand_id, title, description, budget, status, platforms, deliverables, creator_slots, duration, payment_type, created_at",
    )
    .eq("brand_id", userId)
    .order("created_at", { ascending: false });

  const campaigns = campaignError
    ? brandCampaignFallback
    : ((rawCampaigns ?? []) as Array<Record<string, unknown>>).map(
        normalizeCampaign,
      );

  const campaignIds = campaigns.map((campaign) => campaign.id);

  const { data: rawApplications, error: applicationError } = campaignIds.length
    ? await supabase
        .from("campaign_applications")
        .select("id, campaign_id, creator_id, pitch, rate, status, created_at")
        .in("campaign_id", campaignIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  const applications = applicationError
    ? applicationFallback.filter((application) =>
        campaignIds.includes(application.campaign_id),
      )
    : ((rawApplications ?? []) as Array<Record<string, unknown>>).map(
        normalizeApplication,
      );

  const profiles = await getPublicProfiles(
    supabase,
    applications.map((application) => application.creator_id),
  );

  const campaignsWithCounts: BrandCampaignSummary[] = campaigns.map((campaign) => ({
    ...campaign,
    application_count: applications.filter(
      (application) => application.campaign_id === campaign.id,
    ).length,
  }));

  const enrichedApplications: BrandApplicationSummary[] = applications.map(
    (application) => {
      const creator =
        profiles.get(application.creator_id) ??
        publicProfileFallback[application.creator_id];
      const campaign = campaigns.find(
        (campaignItem) => campaignItem.id === application.campaign_id,
      );

      return {
        ...application,
        campaign_title: campaign?.title ?? "Campaign",
        creator_name:
          creator?.display_name ??
          creator?.full_name ??
          creator?.company_name ??
          "Creator",
        creator_headline: creator?.headline ?? null,
      };
    },
  );

  return {
    campaigns: campaignsWithCounts,
    applications: enrichedApplications,
  };
}

async function getCreatorData(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<CreatorDashboardData> {
  const { data: rawCampaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select(
      "id, brand_id, title, description, budget, status, platforms, deliverables, creator_slots, duration, payment_type, created_at",
    )
    .eq("status", "open")
    .neq("brand_id", userId)
    .order("created_at", { ascending: false });

  const campaigns = campaignError
    ? creatorCampaignFallback
    : ((rawCampaigns ?? []) as Array<Record<string, unknown>>).map(
        normalizeCampaign,
      );

  const { data: rawApplications, error: applicationError } = await supabase
    .from("campaign_applications")
    .select("id, campaign_id, creator_id, pitch, rate, status, created_at")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false });

  const applications = applicationError
    ? applicationFallback.filter((application) => application.creator_id === userId)
    : ((rawApplications ?? []) as Array<Record<string, unknown>>).map(
        normalizeApplication,
      );

  const profiles = await getPublicProfiles(
    supabase,
    campaigns.map((campaign) => campaign.brand_id),
  );
  const appliedCampaignIds = new Set(
    applications.map((application) => application.campaign_id),
  );

  const campaignsWithBrand: CreatorCampaignSummary[] = campaigns.map((campaign) => {
    const brand =
      profiles.get(campaign.brand_id) ?? publicProfileFallback[campaign.brand_id];

    return {
      ...campaign,
      brand_name:
        brand?.display_name ?? brand?.company_name ?? brand?.full_name ?? "Brand",
      brand_headline: brand?.headline ?? null,
      has_applied: appliedCampaignIds.has(campaign.id),
    };
  });

  const enrichedApplications: CreatorApplicationSummary[] = applications.map(
    (application) => {
      const campaign =
        campaigns.find((campaignItem) => campaignItem.id === application.campaign_id) ??
        creatorCampaignFallback.find(
          (campaignItem) => campaignItem.id === application.campaign_id,
        );
      const brand =
        (campaign &&
          (profiles.get(campaign.brand_id) ??
            publicProfileFallback[campaign.brand_id])) ||
        null;

      return {
        ...application,
        campaign_title: campaign?.title ?? "Campaign",
        campaign_budget: campaign?.budget ?? 0,
        brand_name:
          brand?.display_name ?? brand?.company_name ?? brand?.full_name ?? "Brand",
      };
    },
  );

  return {
    campaigns: campaignsWithBrand,
    applications: enrichedApplications,
  };
}

export async function getDashboardContext(): Promise<DashboardContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("getDashboardContext: auth.getUser failed", userError);
  }

  if (!user) {
    console.error("getDashboardContext: no authenticated user found in cookies");
    return null;
  }

  const { data: rawProfile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !rawProfile) {
    console.error("getDashboardContext: users profile lookup failed", {
      userId: user.id,
      error,
    });
    return null;
  }

  const profile = normalizeProfile(rawProfile as Record<string, unknown>);

  if (profile.role === "brand") {
    const brandProfile = profile as UserProfile & { role: "brand" };

    return {
      role: "brand",
      profile: brandProfile,
      data: await getBrandData(supabase, brandProfile.id),
    };
  }

  const creatorProfile = profile as UserProfile & { role: "creator" };

  return {
    role: "creator",
    profile: creatorProfile,
    data: await getCreatorData(supabase, creatorProfile.id),
  };
}
