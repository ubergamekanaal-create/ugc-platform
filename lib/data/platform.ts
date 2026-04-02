import { cache } from "react";
import { getSignedCreatorPortfolioAssetUrls } from "@/lib/creator-profile/assets";
import {
  getSignedSubmissionAssetUrls,
  getSubmissionAssetKind,
} from "@/lib/submissions/assets";
import { createClient } from "@/lib/supabase/server";
import type {
  BrandApplicationSummary,
  BrandCampaignSummary,
  BrandCreatorDirectoryEntry,
  BrandDashboardData,
  BrandFundingSummary,
  BrandPayoutSummary,
  BrandSubmissionSummary,
  Campaign,
  CampaignApplication,
  CampaignFunding,
  CampaignInvitation,
  CampaignPayout,
  CampaignSubmission,
  CreatorApplicationSummary,
  CreatorCampaignSummary,
  CreatorDashboardData,
  CreatorProfileDetails,
  CreatorInvitationSummary,
  CreatorPayoutSummary,
  CreatorPortfolioAsset,
  CreatorSubmissionSummary,
  FundingStatus,
  InvitationStatus,
  PayoutStatus,
  PublicProfile,
  Role,
  SubmissionAsset,
  SubmissionStatus,
  UserProfile,
} from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type BrandCreatorDirectoryMode = "full" | "summary" | "none";

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

const campaignSelectFields =
  "id, brand_id, title, description, product_name, product_details, content_type, budget, status, platforms, deliverables, creator_slots, duration, deadline, payment_type, usage_rights, creator_requirements, created_at";

function isRole(value: unknown): value is Role {
  return value === "brand" || value === "creator";
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
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
    stripe_onboarding_complete: readBoolean(row.stripe_onboarding_complete),
    stripe_details_submitted: readBoolean(row.stripe_details_submitted),
    stripe_charges_enabled: readBoolean(row.stripe_charges_enabled),
    stripe_payouts_enabled: readBoolean(row.stripe_payouts_enabled),
    stripe_transfers_enabled: readBoolean(row.stripe_transfers_enabled),
    stripe_onboarding_updated_at: readNullableString(
      row.stripe_onboarding_updated_at,
    ),
    created_at: readNullableString(row.created_at),
  };
}

function normalizeCampaign(row: Record<string, unknown>): Campaign {
  return {
    id: readString(row.id),
    brand_id: readString(row.brand_id),
    title: readString(row.title),
    description: readString(row.description),
    product_name: readString(row.product_name),
    product_details: readString(row.product_details),
    content_type: readString(row.content_type, "UGC Video"),
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
    deadline: readNullableString(row.deadline),
    payment_type: readString(row.payment_type, "Fixed"),
    usage_rights: readString(row.usage_rights),
    creator_requirements: readString(row.creator_requirements),
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

function normalizeSubmission(row: Record<string, unknown>): CampaignSubmission {
  return {
    id: readString(row.id),
    campaign_id: readString(row.campaign_id),
    brand_id: readString(row.brand_id),
    creator_id: readString(row.creator_id),
    application_id: readNullableString(row.application_id),
    revision_number: readNumber(row.revision_number, 1),
    content_links: readStringArray(row.content_links),
    notes: readNullableString(row.notes),
    feedback: readNullableString(row.feedback),
    status:
      row.status === "revision_requested" ||
      row.status === "approved" ||
      row.status === "rejected"
        ? (row.status as SubmissionStatus)
        : "submitted",
    assets: [],
    created_at: readString(row.created_at, new Date().toISOString()),
    updated_at: readString(
      row.updated_at,
      readString(row.created_at, new Date().toISOString()),
    ),
    submitted_at: readNullableString(row.submitted_at),
    reviewed_at: readNullableString(row.reviewed_at),
  };
}

function normalizeSubmissionAsset(
  row: Record<string, unknown>,
  signedUrlMap: Map<string, string | null>,
): SubmissionAsset {
  const storagePath = readString(row.storage_path);

  return {
    id: readString(row.id),
    submission_id: readString(row.submission_id),
    campaign_id: readString(row.campaign_id),
    brand_id: readString(row.brand_id),
    creator_id: readString(row.creator_id),
    revision_number: readNumber(row.revision_number, 1),
    file_name: readString(row.file_name, "Asset"),
    storage_path: storagePath,
    mime_type: readNullableString(row.mime_type),
    size_bytes: readNumber(row.size_bytes),
    kind: getSubmissionAssetKind(readNullableString(row.mime_type)),
    signed_url: signedUrlMap.get(storagePath) ?? null,
    created_at: readString(row.created_at, new Date().toISOString()),
  };
}

function normalizeCreatorPortfolioAsset(
  row: Record<string, unknown>,
  signedUrlMap: Map<string, string | null>,
): CreatorPortfolioAsset {
  const storagePath = readString(row.storage_path);

  return {
    id: readString(row.id),
    user_id: readString(row.user_id),
    file_name: readString(row.file_name, "Portfolio asset"),
    storage_path: storagePath,
    mime_type: readNullableString(row.mime_type),
    kind: getSubmissionAssetKind(readNullableString(row.mime_type)),
    size_bytes: readNumber(row.size_bytes),
    caption: readNullableString(row.caption),
    sort_order: readNumber(row.sort_order),
    signed_url: signedUrlMap.get(storagePath) ?? null,
    created_at: readString(row.created_at, new Date().toISOString()),
  };
}

async function getSubmissionAssetsBySubmissionId(
  supabase: SupabaseServerClient,
  submissionIds: string[],
) {
  if (!submissionIds.length) {
    return new Map<string, SubmissionAsset[]>();
  }

  const { data, error } = await supabase
    .from("campaign_submission_assets")
    .select(
      "id, submission_id, campaign_id, brand_id, creator_id, revision_number, file_name, storage_path, mime_type, size_bytes, created_at",
    )
    .in("submission_id", submissionIds)
    .order("revision_number", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getSubmissionAssetsBySubmissionId: asset lookup failed", {
      submissionIds,
      error,
    });
    return new Map<string, SubmissionAsset[]>();
  }

  const signedUrlMap = await getSignedSubmissionAssetUrls(
    ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
      readString(row.storage_path),
    ),
  );

  const assets = ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
    normalizeSubmissionAsset(row, signedUrlMap),
  );

  return assets.reduce((map, asset) => {
    const existing = map.get(asset.submission_id) ?? [];
    existing.push(asset);
    map.set(asset.submission_id, existing);
    return map;
  }, new Map<string, SubmissionAsset[]>());
}

async function getCreatorPortfolioAssetsByUserId(
  supabase: SupabaseServerClient,
  userIds: string[],
) {
  if (!userIds.length) {
    return new Map<string, CreatorPortfolioAsset[]>();
  }

  const { data, error } = await supabase
    .from("creator_profile_assets")
    .select(
      "id, user_id, file_name, storage_path, mime_type, kind, size_bytes, caption, sort_order, created_at",
    )
    .in("user_id", userIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getCreatorPortfolioAssetsByUserId: asset lookup failed", {
      userIds,
      error,
    });
    return new Map<string, CreatorPortfolioAsset[]>();
  }

  const signedUrlMap = await getSignedCreatorPortfolioAssetUrls(
    ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
      readString(row.storage_path),
    ),
  );

  const assets = ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
    normalizeCreatorPortfolioAsset(row, signedUrlMap),
  );

  return assets.reduce((map, asset) => {
    const existing = map.get(asset.user_id) ?? [];
    existing.push(asset);
    map.set(asset.user_id, existing);
    return map;
  }, new Map<string, CreatorPortfolioAsset[]>());
}

function normalizeFunding(row: Record<string, unknown>): CampaignFunding {
  return {
    id: readString(row.id),
    campaign_id: readNullableString(row.campaign_id),
    brand_id: readString(row.brand_id),
    stripe_checkout_session_id: readNullableString(row.stripe_checkout_session_id),
    stripe_payment_intent_id: readNullableString(row.stripe_payment_intent_id),
    stripe_charge_id: readNullableString(row.stripe_charge_id),
    stripe_transfer_group: readNullableString(row.stripe_transfer_group),
    amount: readNumber(row.amount),
    currency: readString(row.currency, "usd"),
    status:
      row.status === "paid" ||
      row.status === "cancelled" ||
      row.status === "failed"
        ? (row.status as FundingStatus)
        : "pending",
    created_at: readString(row.created_at, new Date().toISOString()),
    paid_at: readNullableString(row.paid_at),
  };
}

function normalizePayout(row: Record<string, unknown>): CampaignPayout {
  return {
    id: readString(row.id),
    campaign_id: readString(row.campaign_id),
    submission_id: readString(row.submission_id),
    brand_id: readString(row.brand_id),
    creator_id: readString(row.creator_id),
    application_id: readNullableString(row.application_id),
    source_funding_id: readNullableString(row.source_funding_id),
    amount: readNumber(row.amount),
    platform_fee_percent: readNumber(row.platform_fee_percent),
    platform_fee_amount: readNumber(row.platform_fee_amount),
    creator_amount: readNumber(row.creator_amount, readNumber(row.amount)),
    currency: readString(row.currency, "usd"),
    status:
      row.status === "paid" || row.status === "failed" || row.status === "reversed"
        ? (row.status as PayoutStatus)
        : "payout_ready",
    stripe_transfer_id: readNullableString(row.stripe_transfer_id),
    stripe_account_id: readNullableString(row.stripe_account_id),
    stripe_source_charge_id: readNullableString(row.stripe_source_charge_id),
    stripe_transfer_group: readNullableString(row.stripe_transfer_group),
    reversed_amount: readNumber(row.reversed_amount),
    failure_reason: readNullableString(row.failure_reason),
    created_at: readString(row.created_at, new Date().toISOString()),
    updated_at: readString(
      row.updated_at,
      readString(row.created_at, new Date().toISOString()),
    ),
    paid_at: readNullableString(row.paid_at),
    reversed_at: readNullableString(row.reversed_at),
  };
}

function normalizeCreatorProfile(
  row: Record<string, unknown>,
): CreatorProfileDetails {
  return {
    user_id: readString(row.user_id),
    bio: readNullableString(row.bio),
    niches: readStringArray(row.niches),
    platform_specialties: readStringArray(row.platform_specialties),
    birth_year:
      row.birth_year === null || row.birth_year === undefined
        ? null
        : readNumber(row.birth_year),
    portfolio_url: readNullableString(row.portfolio_url),
    instagram_url: readNullableString(row.instagram_url),
    instagram_handle: readNullableString(row.instagram_handle),
    instagram_followers: readNumber(row.instagram_followers),
    tiktok_url: readNullableString(row.tiktok_url),
    tiktok_handle: readNullableString(row.tiktok_handle),
    tiktok_followers: readNumber(row.tiktok_followers),
    youtube_url: readNullableString(row.youtube_url),
    youtube_handle: readNullableString(row.youtube_handle),
    youtube_subscribers: readNumber(row.youtube_subscribers),
    website_url: readNullableString(row.website_url),
    base_rate: readNumber(row.base_rate),
    engagement_rate: readNumber(row.engagement_rate),
    average_views: readNumber(row.average_views),
    monthly_ugc_videos: readNumber(row.monthly_ugc_videos),
    featured_content_links: readStringArray(row.featured_content_links),
    featured_brands: readStringArray(row.featured_brands),
    featured_result: readNullableString(row.featured_result),
    audience_summary: readNullableString(row.audience_summary),
    past_work: readNullableString(row.past_work),
    location: readNullableString(row.location),
    onboarding_completed_at: readNullableString(row.onboarding_completed_at),
    created_at: readNullableString(row.created_at),
    updated_at: readNullableString(row.updated_at),
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
  creatorDirectoryMode: BrandCreatorDirectoryMode = "full",
): Promise<BrandDashboardData> {
  const { data: rawCampaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select(campaignSelectFields)
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

  const [
    { data: rawApplications, error: applicationError },
    { data: rawInvitations, error: invitationError },
    { data: rawSubmissions, error: submissionError },
    { data: rawFundings, error: fundingError },
    { data: rawPayouts, error: payoutError },
    { data: rawCreatorDirectory, error: creatorDirectoryError },
  ] = await Promise.all([
    campaignIds.length
      ? supabase
          .from("campaign_applications")
          .select("id, campaign_id, creator_id, pitch, rate, status, created_at")
          .in("campaign_id", campaignIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("campaign_invitations")
      .select(
        "id, campaign_id, brand_id, creator_id, message, offered_rate, status, created_at, updated_at",
      )
      .eq("brand_id", userId)
      .order("created_at", { ascending: false }),
    campaignIds.length
      ? supabase
          .from("campaign_submissions")
          .select(
            "id, campaign_id, brand_id, creator_id, application_id, revision_number, content_links, notes, feedback, status, created_at, updated_at, submitted_at, reviewed_at",
          )
          .in("campaign_id", campaignIds)
          .order("submitted_at", { ascending: false, nullsFirst: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("campaign_fundings")
      .select(
        "id, campaign_id, brand_id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_charge_id, stripe_transfer_group, amount, currency, status, created_at, paid_at",
      )
      .eq("brand_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaign_payouts")
      .select(
        "id, campaign_id, submission_id, brand_id, creator_id, application_id, source_funding_id, amount, platform_fee_percent, platform_fee_amount, creator_amount, currency, status, stripe_transfer_id, stripe_account_id, stripe_source_charge_id, stripe_transfer_group, reversed_amount, failure_reason, created_at, updated_at, paid_at, reversed_at",
      )
      .eq("brand_id", userId)
      .order("created_at", { ascending: false }),
    creatorDirectoryMode === "full"
      ? supabase
          .from("public_profiles")
          .select(
            "id, role, display_name, full_name, company_name, headline, avatar_url",
          )
          .eq("role", "creator")
      : Promise.resolve({ data: [], error: null }),
  ]);

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
  const applicationKeyToRate = new Map(
    applications.map((application) => [
      `${application.campaign_id}:${application.creator_id}`,
      application.rate,
    ]),
  );

  if (invitationError) {
    console.error("getBrandData: invitations lookup failed", {
      userId,
      error: invitationError,
    });
  }

  const invitations = ((rawInvitations ?? []) as Array<Record<string, unknown>>).map(
    normalizeInvitation,
  );

  if (submissionError) {
    console.error("getBrandData: submissions lookup failed", {
      userId,
      campaignIds,
      error: submissionError,
    });
  }

  const submissions = ((rawSubmissions ?? []) as Array<Record<string, unknown>>).map(
    normalizeSubmission,
  );
  const submissionAssetsById = await getSubmissionAssetsBySubmissionId(
    supabase,
    submissions.map((submission) => submission.id),
  );
  const submissionsWithAssets = submissions.map((submission) => ({
    ...submission,
    assets: submissionAssetsById.get(submission.id) ?? [],
  }));

  if (fundingError) {
    console.error("getBrandData: fundings lookup failed", {
      userId,
      error: fundingError,
    });
  }

  const fundings = ((rawFundings ?? []) as Array<Record<string, unknown>>).map(
    normalizeFunding,
  );

  if (payoutError) {
    console.error("getBrandData: payouts lookup failed", {
      userId,
      error: payoutError,
    });
  }

  const payouts = ((rawPayouts ?? []) as Array<Record<string, unknown>>).map(
    normalizePayout,
  );

  const profiles = await getPublicProfiles(
    supabase,
    [
      ...applications.map((application) => application.creator_id),
      ...invitations.map((invitation) => invitation.creator_id),
      ...submissions.map((submission) => submission.creator_id),
      ...payouts.map((payout) => payout.creator_id),
    ],
  );

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

  const relatedCreatorIds = [...new Set([
    ...applications.map((application) => application.creator_id),
    ...invitations.map((invitation) => invitation.creator_id),
    ...submissions.map((submission) => submission.creator_id),
    ...payouts.map((payout) => payout.creator_id),
  ])];
  const creatorDirectoryIds =
    creatorDirectoryMode === "none"
      ? []
      : creatorDirectoryProfiles.length
        ? creatorDirectoryProfiles.map((creator) => creator.id)
        : relatedCreatorIds;
  const [
    { data: rawCreatorProfileDetails, error: creatorProfilesError },
    creatorPortfolioAssetMap,
  ] = await Promise.all([
    creatorDirectoryIds.length
      ? supabase
          .from("creator_profiles")
          .select(
            "user_id, bio, niches, platform_specialties, birth_year, portfolio_url, instagram_url, instagram_handle, instagram_followers, tiktok_url, tiktok_handle, tiktok_followers, youtube_url, youtube_handle, youtube_subscribers, website_url, base_rate, engagement_rate, average_views, monthly_ugc_videos, featured_content_links, featured_brands, featured_result, audience_summary, past_work, location, onboarding_completed_at, created_at, updated_at",
          )
          .in("user_id", [...new Set(creatorDirectoryIds)])
      : Promise.resolve({ data: [], error: null }),
    creatorDirectoryMode === "full" && creatorDirectoryIds.length
      ? getCreatorPortfolioAssetsByUserId(supabase, creatorDirectoryIds)
      : Promise.resolve(new Map<string, CreatorPortfolioAsset[]>()),
  ]);

  if (creatorProfilesError) {
    console.error("getBrandData: creator profile details lookup failed", {
      userId,
      error: creatorProfilesError,
    });
  }

  const creatorProfileMap = new Map(
    ((rawCreatorProfileDetails ?? []) as Array<Record<string, unknown>>).map((row) => {
      const profile = normalizeCreatorProfile(row);
      return [profile.user_id, profile] as const;
    }),
  );

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

  const enrichedSubmissions: BrandSubmissionSummary[] = submissionsWithAssets.map(
    (submission) => {
      const creator = profiles.get(submission.creator_id) ?? null;
      const campaign =
        campaigns.find((campaignItem) => campaignItem.id === submission.campaign_id) ??
        null;

      return {
        ...submission,
        campaign_title: campaign?.title ?? "Campaign",
        creator_name:
          creator?.display_name ??
          creator?.full_name ??
          creator?.company_name ??
          "Creator",
        creator_headline: creator?.headline ?? null,
        rate:
          applicationKeyToRate.get(
            `${submission.campaign_id}:${submission.creator_id}`,
          ) ?? 0,
      };
    },
  );

  const enrichedFundings: BrandFundingSummary[] = fundings.map((funding) => ({
    ...funding,
    campaign_title: funding.campaign_id
      ? campaigns.find((campaign) => campaign.id === funding.campaign_id)?.title ?? null
      : null,
  }));

  const enrichedPayouts: BrandPayoutSummary[] = payouts.map((payout) => {
    const creator = profiles.get(payout.creator_id) ?? null;
    const campaign = campaigns.find((item) => item.id === payout.campaign_id) ?? null;

    return {
      ...payout,
      campaign_title: campaign?.title ?? "Campaign",
      creator_name:
        creator?.display_name ??
        creator?.full_name ??
        creator?.company_name ??
        "Creator",
      creator_headline: creator?.headline ?? null,
    };
  });

  const creatorDirectorySource =
    creatorDirectoryMode === "none"
      ? []
      : creatorDirectoryProfiles.length
        ? creatorDirectoryProfiles
        : [...profiles.values()].filter((profile) => profile.role === "creator");
  const creatorDirectory = creatorDirectorySource
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
      const creatorProfile = creatorProfileMap.get(creator.id) ?? null;
      const highestApplicationRate = creatorApplications.reduce(
        (highest, application) => Math.max(highest, application.rate),
        0,
      );
      const displayRate = Math.max(
        highestApplicationRate,
        creatorProfile?.base_rate ?? 0,
      );
      const primaryNiche = creatorProfile?.niches[0] ?? null;
      const primaryPlatform = creatorProfile?.platform_specialties[0] ?? null;

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
        rate: displayRate,
        base_rate: creatorProfile?.base_rate ?? 0,
        focus:
          primaryNiche ??
          primaryPlatform ??
          creator.headline ??
          matchedCampaign?.title ??
          "Open to short-form collaborations",
        bio: creatorProfile?.bio ?? null,
        niches: creatorProfile?.niches ?? [],
        platform_specialties: creatorProfile?.platform_specialties ?? [],
        birth_year: creatorProfile?.birth_year ?? null,
        portfolio_url: creatorProfile?.portfolio_url ?? null,
        instagram_url: creatorProfile?.instagram_url ?? null,
        instagram_handle: creatorProfile?.instagram_handle ?? null,
        instagram_followers: creatorProfile?.instagram_followers ?? 0,
        tiktok_url: creatorProfile?.tiktok_url ?? null,
        tiktok_handle: creatorProfile?.tiktok_handle ?? null,
        tiktok_followers: creatorProfile?.tiktok_followers ?? 0,
        youtube_url: creatorProfile?.youtube_url ?? null,
        youtube_handle: creatorProfile?.youtube_handle ?? null,
        youtube_subscribers: creatorProfile?.youtube_subscribers ?? 0,
        website_url: creatorProfile?.website_url ?? null,
        engagement_rate: creatorProfile?.engagement_rate ?? 0,
        average_views: creatorProfile?.average_views ?? 0,
        monthly_ugc_videos: creatorProfile?.monthly_ugc_videos ?? 0,
        featured_content_links: creatorProfile?.featured_content_links ?? [],
        featured_brands: creatorProfile?.featured_brands ?? [],
        featured_result: creatorProfile?.featured_result ?? null,
        portfolio_assets: creatorPortfolioAssetMap.get(creator.id) ?? [],
        audience_summary: creatorProfile?.audience_summary ?? null,
        past_work: creatorProfile?.past_work ?? null,
        location: creatorProfile?.location ?? null,
        onboarding_completed_at: creatorProfile?.onboarding_completed_at ?? null,
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
    submissions: enrichedSubmissions,
    creators: creatorDirectory,
    invitations,
    fundings: enrichedFundings,
    payouts: enrichedPayouts,
  };
}

async function getCreatorData(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<CreatorDashboardData> {
  const [
    { data: rawCampaigns, error: campaignError },
    { data: rawApplications, error: applicationError },
    { data: rawInvitations, error: invitationError },
    { data: rawSubmissions, error: submissionError },
    { data: rawPayouts, error: payoutError },
    { data: rawCreatorProfile, error: creatorProfileError },
    creatorPortfolioAssetMap,
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select(campaignSelectFields)
      .eq("status", "open")
      .neq("brand_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaign_applications")
      .select("id, campaign_id, creator_id, pitch, rate, status, created_at")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaign_invitations")
      .select(
        "id, campaign_id, brand_id, creator_id, message, offered_rate, status, created_at, updated_at",
      )
      .eq("creator_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("campaign_submissions")
      .select(
        "id, campaign_id, brand_id, creator_id, application_id, revision_number, content_links, notes, feedback, status, created_at, updated_at, submitted_at, reviewed_at",
      )
      .eq("creator_id", userId)
      .order("submitted_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("campaign_payouts")
      .select(
        "id, campaign_id, submission_id, brand_id, creator_id, application_id, source_funding_id, amount, platform_fee_percent, platform_fee_amount, creator_amount, currency, status, stripe_transfer_id, stripe_account_id, stripe_source_charge_id, stripe_transfer_group, reversed_amount, failure_reason, created_at, updated_at, paid_at, reversed_at",
      )
      .eq("creator_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("creator_profiles")
      .select(
        "user_id, bio, niches, platform_specialties, birth_year, portfolio_url, instagram_url, instagram_handle, instagram_followers, tiktok_url, tiktok_handle, tiktok_followers, youtube_url, youtube_handle, youtube_subscribers, website_url, base_rate, engagement_rate, average_views, monthly_ugc_videos, featured_content_links, featured_brands, featured_result, audience_summary, past_work, location, onboarding_completed_at, created_at, updated_at",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    getCreatorPortfolioAssetsByUserId(supabase, [userId]),
  ]);

  if (campaignError) {
    console.error("getCreatorData: open campaigns lookup failed", {
      userId,
      error: campaignError,
    });
  }

  const campaigns = ((rawCampaigns ?? []) as Array<Record<string, unknown>>).map(
    normalizeCampaign,
  );

  if (applicationError) {
    console.error("getCreatorData: applications lookup failed", {
      userId,
      error: applicationError,
    });
  }

  const applications = ((rawApplications ?? []) as Array<Record<string, unknown>>).map(
    normalizeApplication,
  );
  const applicationMap = new Map(
    applications.map((application) => [
      `${application.campaign_id}:${application.creator_id}`,
      application,
    ]),
  );

  if (invitationError) {
    console.error("getCreatorData: invitations lookup failed", {
      userId,
      error: invitationError,
    });
  }

  const invitations = ((rawInvitations ?? []) as Array<Record<string, unknown>>).map(
    normalizeInvitation,
  );

  if (submissionError) {
    console.error("getCreatorData: submissions lookup failed", {
      userId,
      error: submissionError,
    });
  }

  const submissions = ((rawSubmissions ?? []) as Array<Record<string, unknown>>).map(
    normalizeSubmission,
  );
  const submissionAssetsById = await getSubmissionAssetsBySubmissionId(
    supabase,
    submissions.map((submission) => submission.id),
  );
  const submissionsWithAssets = submissions.map((submission) => ({
    ...submission,
    assets: submissionAssetsById.get(submission.id) ?? [],
  }));

  if (payoutError) {
    console.error("getCreatorData: payouts lookup failed", {
      userId,
      error: payoutError,
    });
  }

  const payouts = ((rawPayouts ?? []) as Array<Record<string, unknown>>).map(
    normalizePayout,
  );

  if (creatorProfileError) {
    console.error("getCreatorData: creator profile lookup failed", {
      userId,
      error: creatorProfileError,
    });
  }

  const creatorProfile =
    rawCreatorProfile && !Array.isArray(rawCreatorProfile)
      ? normalizeCreatorProfile(rawCreatorProfile as Record<string, unknown>)
      : null;
  const creatorPortfolioAssets = creatorPortfolioAssetMap.get(userId) ?? [];

  const appliedCampaignIds = [...new Set(applications.map((application) => application.campaign_id))];
  const missingCampaignIds = appliedCampaignIds.filter(
    (campaignId) => !campaigns.some((campaign) => campaign.id === campaignId),
  );

  const invitationCampaignIds = [
    ...new Set(invitations.map((invitation) => invitation.campaign_id)),
  ];
  const submissionCampaignIds = [
    ...new Set(submissions.map((submission) => submission.campaign_id)),
  ];
  const missingInvitationCampaignIds = invitationCampaignIds.filter(
    (campaignId) =>
      !campaigns.some((campaign) => campaign.id === campaignId) &&
      !missingCampaignIds.includes(campaignId),
  );
  const missingSubmissionCampaignIds = submissionCampaignIds.filter(
    (campaignId) =>
      !campaigns.some((campaign) => campaign.id === campaignId) &&
      !missingCampaignIds.includes(campaignId) &&
      !missingInvitationCampaignIds.includes(campaignId),
  );

  const missingRelatedCampaignIds = [
    ...new Set([
      ...missingCampaignIds,
      ...missingInvitationCampaignIds,
      ...missingSubmissionCampaignIds,
    ]),
  ];
  const { data: rawRelatedCampaigns, error: relatedCampaignsError } =
    missingRelatedCampaignIds.length
      ? await supabase
          .from("campaigns")
          .select(campaignSelectFields)
          .in("id", missingRelatedCampaignIds)
      : { data: [], error: null };

  if (relatedCampaignsError) {
    console.error("getCreatorData: related campaigns lookup failed", {
      userId,
      campaignIds: missingRelatedCampaignIds,
      error: relatedCampaignsError,
    });
  }

  const relatedCampaigns = ((rawRelatedCampaigns ?? []) as Array<Record<string, unknown>>).map(
    normalizeCampaign,
  );
  const campaignMap = new Map(
    [...campaigns, ...relatedCampaigns].map((campaign) => [campaign.id, campaign]),
  );

  const profiles = await getPublicProfiles(
    supabase,
    [
      ...new Set([
        ...[...campaignMap.values()].map((campaign) => campaign.brand_id),
        ...invitations.map((invitation) => invitation.brand_id),
        ...submissions.map((submission) => submission.brand_id),
        ...payouts.map((payout) => payout.brand_id),
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
        campaign_description: campaign?.description ?? "",
        product_name: campaign?.product_name ?? "",
        product_details: campaign?.product_details ?? "",
        content_type: campaign?.content_type ?? "UGC Video",
        deliverables: campaign?.deliverables ?? "",
        duration: campaign?.duration ?? "14 days",
        deadline: campaign?.deadline ?? null,
        payment_type: campaign?.payment_type ?? "Fixed",
        usage_rights: campaign?.usage_rights ?? "",
        creator_requirements: campaign?.creator_requirements ?? "",
        platforms: campaign?.platforms ?? [],
        brand_id: campaign?.brand_id ?? "",
        brand_name:
          brand?.display_name ?? brand?.company_name ?? brand?.full_name ?? "Brand",
        brand_headline: brand?.headline ?? null,
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
        product_name: campaign?.product_name ?? "",
        product_details: campaign?.product_details ?? "",
        content_type: campaign?.content_type ?? "UGC Video",
        deliverables: campaign?.deliverables ?? "",
        duration: campaign?.duration ?? "14 days",
        deadline: campaign?.deadline ?? null,
        payment_type: campaign?.payment_type ?? "Fixed",
        usage_rights: campaign?.usage_rights ?? "",
        creator_requirements: campaign?.creator_requirements ?? "",
        platforms: campaign?.platforms ?? [],
        brand_name:
          brand?.display_name ?? brand?.company_name ?? brand?.full_name ?? "Brand",
        brand_headline: brand?.headline ?? null,
      };
    },
  );

  const enrichedSubmissions: CreatorSubmissionSummary[] = submissionsWithAssets.map(
    (submission) => {
      const campaign = campaignMap.get(submission.campaign_id) ?? null;
      const brand =
        profiles.get(submission.brand_id) ??
        (campaign ? profiles.get(campaign.brand_id) ?? null : null);
      const application =
        applicationMap.get(`${submission.campaign_id}:${submission.creator_id}`) ??
        null;

      return {
        ...submission,
        campaign_title: campaign?.title ?? "Campaign",
        campaign_budget: campaign?.budget ?? 0,
        campaign_description: campaign?.description ?? "",
        product_name: campaign?.product_name ?? "",
        product_details: campaign?.product_details ?? "",
        content_type: campaign?.content_type ?? "UGC Video",
        deliverables: campaign?.deliverables ?? "",
        duration: campaign?.duration ?? "14 days",
        deadline: campaign?.deadline ?? null,
        payment_type: campaign?.payment_type ?? "Fixed",
        usage_rights: campaign?.usage_rights ?? "",
        creator_requirements: campaign?.creator_requirements ?? "",
        platforms: campaign?.platforms ?? [],
        brand_name:
          brand?.display_name ?? brand?.company_name ?? brand?.full_name ?? "Brand",
        brand_headline: brand?.headline ?? null,
        rate: application?.rate ?? 0,
      };
    },
  );

  const enrichedPayouts: CreatorPayoutSummary[] = payouts.map((payout) => {
    const campaign = campaignMap.get(payout.campaign_id) ?? null;
    const brand =
      profiles.get(payout.brand_id) ??
      (campaign ? profiles.get(campaign.brand_id) ?? null : null);

    return {
      ...payout,
      campaign_title: campaign?.title ?? "Campaign",
      brand_name:
        brand?.display_name ?? brand?.company_name ?? brand?.full_name ?? "Brand",
      brand_headline: brand?.headline ?? null,
    };
  });

  return {
    campaigns: campaignsWithBrand,
    applications: enrichedApplications,
    invitations: enrichedInvitations,
    submissions: enrichedSubmissions,
    payouts: enrichedPayouts,
    profile_details: creatorProfile,
    profile_assets: creatorPortfolioAssets,
  };
}

function getBrandCreatorDirectoryMode(
  section: string | null | undefined,
): BrandCreatorDirectoryMode {
  if (section === "creators") {
    return "full";
  }

  if (section === "dashboard" || section === "home" || section === "submissions") {
    return "summary";
  }

  return "none";
}

export const getDashboardContext = cache(
  async (section?: string | null): Promise<DashboardContext | null> => {
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
        data: await getBrandData(
          supabase,
          brandProfile.id,
          getBrandCreatorDirectoryMode(section),
        ),
      };
    }

    const creatorProfile = profile as UserProfile & { role: "creator" };

    return {
      role: "creator",
      profile: creatorProfile,
      data: await getCreatorData(supabase, creatorProfile.id),
    };
  },
);
