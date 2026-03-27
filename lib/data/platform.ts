import { createClient } from "@/lib/supabase/server";
import type {
  BrandApplicationSummary,
  BrandCampaignSummary,
  BrandCreatorDirectoryEntry,
  BrandDashboardData,
  Campaign,
  CampaignApplication,
  CampaignInvitation,
  CreatorApplicationSummary,
  CreatorCampaignSummary,
  CreatorDashboardData,
  CreatorInvitationSummary,
  InvitationStatus,
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

function normalizeInvitation(row: Record<string, unknown>): CampaignInvitation {
  return {
    id: readString(row.id),
    campaign_id: readString(row.campaign_id),
    brand_id: readString(row.brand_id),
    creator_id: readString(row.creator_id),
    message: readNullableString(row.message),
    offered_rate: readNumber(row.offered_rate),
    status:
      row.status === "accepted" || row.status === "declined"
        ? (row.status as InvitationStatus)
        : "pending",
    created_at: readString(row.created_at, new Date().toISOString()),
    updated_at: readString(
      row.updated_at,
      readString(row.created_at, new Date().toISOString()),
    ),
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
    console.error("getPublicProfiles: public_profiles lookup failed", {
      ids: uniqueIds,
      error,
    });
    return new Map<string, PublicProfile>();
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

  if (campaignError) {
    console.error("getBrandData: campaigns lookup failed", {
      userId,
      error: campaignError,
    });
  }

  const campaigns = ((rawCampaigns ?? []) as Array<Record<string, unknown>>).map(
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

  if (applicationError) {
    console.error("getBrandData: applications lookup failed", {
      userId,
      campaignIds,
      error: applicationError,
    });
  }

  const applications = ((rawApplications ?? []) as Array<Record<string, unknown>>).map(
    normalizeApplication,
  );

  const { data: rawInvitations, error: invitationError } = await supabase
    .from("campaign_invitations")
    .select(
      "id, campaign_id, brand_id, creator_id, message, offered_rate, status, created_at, updated_at",
    )
    .eq("brand_id", userId)
    .order("created_at", { ascending: false });

  if (invitationError) {
    console.error("getBrandData: invitations lookup failed", {
      userId,
      error: invitationError,
    });
  }

  const invitations = ((rawInvitations ?? []) as Array<Record<string, unknown>>).map(
    normalizeInvitation,
  );

  const profiles = await getPublicProfiles(
    supabase,
    [
      ...applications.map((application) => application.creator_id),
      ...invitations.map((invitation) => invitation.creator_id),
    ],
  );

  const { data: rawCreatorDirectory, error: creatorDirectoryError } = await supabase
    .from("public_profiles")
    .select(
      "id, role, display_name, full_name, company_name, headline, avatar_url",
    )
    .eq("role", "creator");

  if (creatorDirectoryError) {
    console.error("getBrandData: creator directory lookup failed", {
      userId,
      error: creatorDirectoryError,
    });
  }

  const creatorDirectoryProfiles = creatorDirectoryError
    ? []
    : ((rawCreatorDirectory ?? []) as Array<Record<string, unknown>>).map((row) => ({
        id: readString(row.id),
        role: isRole(row.role) ? row.role : "creator",
        display_name: readNullableString(row.display_name),
        full_name: readNullableString(row.full_name),
        company_name: readNullableString(row.company_name),
        headline: readNullableString(row.headline),
        avatar_url: readNullableString(row.avatar_url),
      }));

  const campaignsWithCounts: BrandCampaignSummary[] = campaigns.map((campaign) => ({
    ...campaign,
    application_count: applications.filter(
      (application) => application.campaign_id === campaign.id,
    ).length,
  }));

  const enrichedApplications: BrandApplicationSummary[] = applications.map(
    (application) => {
      const creator = profiles.get(application.creator_id) ?? null;
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

  const creatorDirectory = (
    creatorDirectoryProfiles.length
      ? creatorDirectoryProfiles
      : [...profiles.values()].filter((profile) => profile.role === "creator")
  )
    .map((creator): BrandCreatorDirectoryEntry => {
      const creatorApplications = applications.filter(
        (application) => application.creator_id === creator.id,
      );
      const creatorInvitations = invitations.filter(
        (invitation) => invitation.creator_id === creator.id,
      );
      const latestApplication = creatorApplications[0] ?? null;
      const matchedCampaign = latestApplication
        ? campaigns.find((campaign) => campaign.id === latestApplication.campaign_id)
        : null;

      return {
        id: creator.id,
        name:
          creator.display_name ??
          creator.full_name ??
          creator.company_name ??
          "Creator",
        headline: creator.headline ?? null,
        avatar_url: creator.avatar_url ?? null,
        applications: creatorApplications.length,
        accepted: creatorApplications.filter(
          (application) => application.status === "accepted",
        ).length,
        rate: creatorApplications.reduce(
          (highest, application) => Math.max(highest, application.rate),
          0,
        ),
        focus:
          matchedCampaign?.title ??
          creator.headline ??
          "Open to short-form collaborations",
        latest_campaign_title: matchedCampaign?.title ?? null,
        latest_application_at: latestApplication?.created_at ?? null,
        invitations: creatorInvitations.length,
        pending_invitations: creatorInvitations.filter(
          (invitation) => invitation.status === "pending",
        ).length,
        invited_campaign_ids: [
          ...new Set(
            creatorInvitations
              .filter((invitation) => invitation.status !== "declined")
              .map((invitation) => invitation.campaign_id),
          ),
        ],
        last_invited_at: creatorInvitations[0]?.created_at ?? null,
      };
    })
    .sort((left, right) => {
      const scoreLeft =
        left.accepted * 5 + left.applications * 3 + left.pending_invitations * 2;
      const scoreRight =
        right.accepted * 5 + right.applications * 3 + right.pending_invitations * 2;

      if (scoreRight !== scoreLeft) {
        return scoreRight - scoreLeft;
      }

      return left.name.localeCompare(right.name);
    });

  return {
    campaigns: campaignsWithCounts,
    applications: enrichedApplications,
    creators: creatorDirectory,
    invitations,
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

  if (campaignError) {
    console.error("getCreatorData: open campaigns lookup failed", {
      userId,
      error: campaignError,
    });
  }

  const campaigns = ((rawCampaigns ?? []) as Array<Record<string, unknown>>).map(
    normalizeCampaign,
  );

  const { data: rawApplications, error: applicationError } = await supabase
    .from("campaign_applications")
    .select("id, campaign_id, creator_id, pitch, rate, status, created_at")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false });

  if (applicationError) {
    console.error("getCreatorData: applications lookup failed", {
      userId,
      error: applicationError,
    });
  }

  const applications = ((rawApplications ?? []) as Array<Record<string, unknown>>).map(
    normalizeApplication,
  );

  const { data: rawInvitations, error: invitationError } = await supabase
    .from("campaign_invitations")
    .select(
      "id, campaign_id, brand_id, creator_id, message, offered_rate, status, created_at, updated_at",
    )
    .eq("creator_id", userId)
    .order("created_at", { ascending: false });

  if (invitationError) {
    console.error("getCreatorData: invitations lookup failed", {
      userId,
      error: invitationError,
    });
  }

  const invitations = ((rawInvitations ?? []) as Array<Record<string, unknown>>).map(
    normalizeInvitation,
  );

  const appliedCampaignIds = [...new Set(applications.map((application) => application.campaign_id))];
  const missingCampaignIds = appliedCampaignIds.filter(
    (campaignId) => !campaigns.some((campaign) => campaign.id === campaignId),
  );

  const invitationCampaignIds = [
    ...new Set(invitations.map((invitation) => invitation.campaign_id)),
  ];
  const missingInvitationCampaignIds = invitationCampaignIds.filter(
    (campaignId) =>
      !campaigns.some((campaign) => campaign.id === campaignId) &&
      !missingCampaignIds.includes(campaignId),
  );

  const { data: rawAppliedCampaigns, error: appliedCampaignsError } = missingCampaignIds.length
    ? await supabase
        .from("campaigns")
        .select(
          "id, brand_id, title, description, budget, status, platforms, deliverables, creator_slots, duration, payment_type, created_at",
        )
        .in("id", missingCampaignIds)
    : { data: [], error: null };

  if (appliedCampaignsError) {
    console.error("getCreatorData: applied campaigns lookup failed", {
      userId,
      campaignIds: missingCampaignIds,
      error: appliedCampaignsError,
    });
  }

  const applicationCampaigns = ((rawAppliedCampaigns ?? []) as Array<Record<string, unknown>>).map(
    normalizeCampaign,
  );
  const { data: rawInvitationCampaigns, error: invitationCampaignsError } =
    missingInvitationCampaignIds.length
      ? await supabase
          .from("campaigns")
          .select(
            "id, brand_id, title, description, budget, status, platforms, deliverables, creator_slots, duration, payment_type, created_at",
          )
          .in("id", missingInvitationCampaignIds)
      : { data: [], error: null };

  if (invitationCampaignsError) {
    console.error("getCreatorData: invitation campaigns lookup failed", {
      userId,
      campaignIds: missingInvitationCampaignIds,
      error: invitationCampaignsError,
    });
  }

  const invitationCampaigns = ((rawInvitationCampaigns ?? []) as Array<Record<string, unknown>>).map(
    normalizeCampaign,
  );
  const campaignMap = new Map(
    [...campaigns, ...applicationCampaigns, ...invitationCampaigns].map((campaign) => [
      campaign.id,
      campaign,
    ]),
  );

  const profiles = await getPublicProfiles(
    supabase,
    [
      ...new Set([
        ...[...campaignMap.values()].map((campaign) => campaign.brand_id),
        ...invitations.map((invitation) => invitation.brand_id),
      ]),
    ],
  );
  const appliedCampaignIdSet = new Set(appliedCampaignIds);

  const campaignsWithBrand: CreatorCampaignSummary[] = campaigns.map((campaign) => {
    const brand = profiles.get(campaign.brand_id) ?? null;

    return {
      ...campaign,
      brand_name:
        brand?.display_name ?? brand?.company_name ?? brand?.full_name ?? "Brand",
      brand_headline: brand?.headline ?? null,
      has_applied: appliedCampaignIdSet.has(campaign.id),
    };
  });

  const enrichedApplications: CreatorApplicationSummary[] = applications.map(
    (application) => {
      const campaign = campaignMap.get(application.campaign_id) ?? null;
      const brand = campaign ? profiles.get(campaign.brand_id) ?? null : null;

      return {
        ...application,
        campaign_title: campaign?.title ?? "Campaign",
        campaign_budget: campaign?.budget ?? 0,
        brand_id: campaign?.brand_id ?? "",
        brand_name:
          brand?.display_name ?? brand?.company_name ?? brand?.full_name ?? "Brand",
      };
    },
  );

  const enrichedInvitations: CreatorInvitationSummary[] = invitations.map(
    (invitation) => {
      const campaign = campaignMap.get(invitation.campaign_id) ?? null;
      const brand =
        profiles.get(invitation.brand_id) ??
        (campaign ? profiles.get(campaign.brand_id) ?? null : null);

      return {
        ...invitation,
        campaign_title: campaign?.title ?? "Campaign",
        campaign_budget: campaign?.budget ?? 0,
        campaign_description: campaign?.description ?? "",
        deliverables: campaign?.deliverables ?? "",
        duration: campaign?.duration ?? "14 days",
        payment_type: campaign?.payment_type ?? "Fixed",
        platforms: campaign?.platforms ?? [],
        brand_name:
          brand?.display_name ?? brand?.company_name ?? brand?.full_name ?? "Brand",
        brand_headline: brand?.headline ?? null,
      };
    },
  );

  return {
    campaigns: campaignsWithBrand,
    applications: enrichedApplications,
    invitations: enrichedInvitations,
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
