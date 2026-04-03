import { NextResponse } from "next/server";
import type {
  BrandMetaAdAccountSummary,
  BrandMetaAdSetSummary,
  BrandMetaAdSummary,
  BrandMetaCampaignSummary,
  BrandMetaConnectionSummary,
  MetaConnectionStatus,
} from "@/lib/types";
import type {
  MetaAdAccount,
  MetaAdSetSnapshot,
  MetaAdSnapshot,
  MetaCampaignSnapshot,
} from "@/lib/integrations/meta";
import { fetchMetaAdSets, fetchMetaAds, fetchMetaCampaigns } from "@/lib/integrations/meta";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function readStatus(value: unknown): MetaConnectionStatus {
  return value === "connected" || value === "error" ? value : "pending";
}

export type MetaConnectionRow = {
  id: string;
  brand_id: string;
  meta_user_id: string;
  meta_user_name: string | null;
  business_id: string | null;
  business_name: string | null;
  ad_account_id: string | null;
  ad_account_name: string | null;
  access_token: string;
  token_expires_at: string | null;
  permissions: string[];
  status: MetaConnectionStatus;
  last_error: string | null;
  connected_at: string;
  last_synced_at: string | null;
};

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

export type MetaIntegrationPayload = {
  connection: BrandMetaConnectionSummary | null;
  adAccounts: BrandMetaAdAccountSummary[];
  campaigns: BrandMetaCampaignSummary[];
  adSets: BrandMetaAdSetSummary[];
  ads: BrandMetaAdSummary[];
  message?: string;
  error?: string;
};

export async function requireBrandUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "brand") {
    return {
      error: NextResponse.json(
        { error: "Only brand accounts can manage Meta ads." },
        { status: 403 },
      ),
    };
  }

  return { brandId: user.id };
}

export function sanitizeMetaConnection(
  row: Record<string, unknown>,
): BrandMetaConnectionSummary {
  return {
    id: readString(row.id),
    brand_id: readString(row.brand_id),
    meta_user_id: readString(row.meta_user_id),
    meta_user_name: readNullableString(row.meta_user_name),
    business_id: readNullableString(row.business_id),
    business_name: readNullableString(row.business_name),
    ad_account_id: readNullableString(row.ad_account_id),
    ad_account_name: readNullableString(row.ad_account_name),
    status: readStatus(row.status),
    permissions: readStringArray(row.permissions),
    token_expires_at: readNullableString(row.token_expires_at),
    connected_at: readString(row.connected_at, new Date().toISOString()),
    last_synced_at: readNullableString(row.last_synced_at),
    last_error: readNullableString(row.last_error),
  };
}

export function sanitizeMetaAdAccount(
  row: Record<string, unknown>,
): BrandMetaAdAccountSummary {
  return {
    id: readString(row.id),
    connection_id: readString(row.connection_id),
    brand_id: readString(row.brand_id),
    meta_account_id: readString(row.meta_account_id),
    account_name: readString(row.account_name, "Meta ad account"),
    account_status: readNullableString(row.account_status),
    currency: readNullableString(row.currency),
    business_id: readNullableString(row.business_id),
    business_name: readNullableString(row.business_name),
    is_selected: readBoolean(row.is_selected),
    created_at: readString(row.created_at, new Date().toISOString()),
    updated_at: readString(row.updated_at, new Date().toISOString()),
  };
}

export function sanitizeMetaCampaign(
  row: Record<string, unknown>,
): BrandMetaCampaignSummary {
  return {
    id: readString(row.id),
    connection_id: readString(row.connection_id),
    brand_id: readString(row.brand_id),
    ad_account_id: readString(row.ad_account_id),
    meta_campaign_id: readString(row.meta_campaign_id),
    source_submission_id: readNullableString(row.source_submission_id),
    destination_url: readNullableString(row.destination_url),
    tracking_url: readNullableString(row.tracking_url),
    utm_source: readNullableString(row.utm_source),
    utm_medium: readNullableString(row.utm_medium),
    utm_campaign: readNullableString(row.utm_campaign),
    utm_content: readNullableString(row.utm_content),
    utm_term: readNullableString(row.utm_term),
    name: readString(row.name, "Meta campaign"),
    objective: readNullableString(row.objective),
    status: readNullableString(row.status),
    effective_status: readNullableString(row.effective_status),
    daily_budget:
      row.daily_budget === null || row.daily_budget === undefined
        ? null
        : readNumber(row.daily_budget),
    lifetime_budget:
      row.lifetime_budget === null || row.lifetime_budget === undefined
        ? null
        : readNumber(row.lifetime_budget),
    spend: readNumber(row.spend),
    impressions: readNumber(row.impressions),
    clicks: readNumber(row.clicks),
    ctr: readNumber(row.ctr),
    cpc:
      row.cpc === null || row.cpc === undefined ? null : readNumber(row.cpc),
    cpm:
      row.cpm === null || row.cpm === undefined ? null : readNumber(row.cpm),
    synced_at: readString(row.synced_at, new Date().toISOString()),
    created_at: readString(row.created_at, new Date().toISOString()),
    updated_at: readString(row.updated_at, new Date().toISOString()),
  };
}

export function sanitizeMetaAdSet(
  row: Record<string, unknown>,
): BrandMetaAdSetSummary {
  return {
    id: readString(row.id),
    connection_id: readString(row.connection_id),
    campaign_id: readString(row.campaign_id),
    brand_id: readString(row.brand_id),
    source_submission_id: readNullableString(row.source_submission_id),
    meta_campaign_id: readString(row.meta_campaign_id),
    meta_ad_set_id: readString(row.meta_ad_set_id),
    name: readString(row.name, "Meta ad set"),
    status: readNullableString(row.status),
    effective_status: readNullableString(row.effective_status),
    destination_type: readNullableString(row.destination_type),
    billing_event: readNullableString(row.billing_event),
    optimization_goal: readNullableString(row.optimization_goal),
    daily_budget:
      row.daily_budget === null || row.daily_budget === undefined
        ? null
        : readNumber(row.daily_budget),
    spend: readNumber(row.spend),
    impressions: readNumber(row.impressions),
    clicks: readNumber(row.clicks),
    ctr: readNumber(row.ctr),
    cpc:
      row.cpc === null || row.cpc === undefined ? null : readNumber(row.cpc),
    cpm:
      row.cpm === null || row.cpm === undefined ? null : readNumber(row.cpm),
    targeting_countries: readStringArray(row.targeting_countries),
    synced_at: readString(row.synced_at, new Date().toISOString()),
    created_at: readString(row.created_at, new Date().toISOString()),
    updated_at: readString(row.updated_at, new Date().toISOString()),
  };
}

export function sanitizeMetaAd(
  row: Record<string, unknown>,
): BrandMetaAdSummary {
  return {
    id: readString(row.id),
    connection_id: readString(row.connection_id),
    campaign_id: readString(row.campaign_id),
    ad_set_id: readString(row.ad_set_id),
    brand_id: readString(row.brand_id),
    source_submission_id: readNullableString(row.source_submission_id),
    selected_asset_id: readNullableString(row.selected_asset_id),
    meta_campaign_id: readString(row.meta_campaign_id),
    meta_ad_set_id: readString(row.meta_ad_set_id),
    meta_ad_id: readString(row.meta_ad_id),
    meta_creative_id: readNullableString(row.meta_creative_id),
    name: readString(row.name, "Meta ad"),
    status: readNullableString(row.status),
    effective_status: readNullableString(row.effective_status),
    page_id: readNullableString(row.page_id),
    source_asset_kind: readNullableString(row.source_asset_kind),
    source_asset_url: readNullableString(row.source_asset_url),
    destination_url: readNullableString(row.destination_url),
    tracking_url: readNullableString(row.tracking_url),
    primary_text: readNullableString(row.primary_text),
    headline: readNullableString(row.headline),
    description: readNullableString(row.description),
    call_to_action_type: readNullableString(row.call_to_action_type),
    spend: readNumber(row.spend),
    impressions: readNumber(row.impressions),
    clicks: readNumber(row.clicks),
    ctr: readNumber(row.ctr),
    cpc:
      row.cpc === null || row.cpc === undefined ? null : readNumber(row.cpc),
    cpm:
      row.cpm === null || row.cpm === undefined ? null : readNumber(row.cpm),
    synced_at: readString(row.synced_at, new Date().toISOString()),
    created_at: readString(row.created_at, new Date().toISOString()),
    updated_at: readString(row.updated_at, new Date().toISOString()),
  };
}

export async function readMetaPayload(admin: AdminClient, brandId: string) {
  const [
    { data: connectionRow },
    { data: adAccounts },
    { data: campaigns },
    { data: adSets },
    { data: ads },
  ] = await Promise.all([
    admin
      .from("brand_meta_connections")
      .select(
        "id, brand_id, meta_user_id, meta_user_name, business_id, business_name, ad_account_id, ad_account_name, access_token, token_expires_at, permissions, status, last_error, connected_at, last_synced_at",
      )
      .eq("brand_id", brandId)
      .maybeSingle(),
    admin
      .from("brand_meta_ad_accounts")
      .select(
        "id, connection_id, brand_id, meta_account_id, account_name, account_status, currency, business_id, business_name, is_selected, created_at, updated_at",
      )
      .eq("brand_id", brandId)
      .order("is_selected", { ascending: false })
      .order("account_name", { ascending: true }),
    admin
      .from("brand_meta_campaigns")
      .select(
        "id, connection_id, brand_id, ad_account_id, meta_campaign_id, source_submission_id, destination_url, tracking_url, utm_source, utm_medium, utm_campaign, utm_content, utm_term, name, objective, status, effective_status, daily_budget, lifetime_budget, spend, impressions, clicks, ctr, cpc, cpm, synced_at, created_at, updated_at",
      )
      .eq("brand_id", brandId)
      .order("synced_at", { ascending: false })
      .limit(50),
    admin
      .from("brand_meta_ad_sets")
      .select(
        "id, connection_id, campaign_id, brand_id, source_submission_id, meta_campaign_id, meta_ad_set_id, name, status, effective_status, destination_type, billing_event, optimization_goal, daily_budget, spend, impressions, clicks, ctr, cpc, cpm, targeting_countries, synced_at, created_at, updated_at",
      )
      .eq("brand_id", brandId)
      .order("synced_at", { ascending: false })
      .limit(100),
    admin
      .from("brand_meta_ads")
      .select(
        "id, connection_id, campaign_id, ad_set_id, brand_id, source_submission_id, selected_asset_id, meta_campaign_id, meta_ad_set_id, meta_ad_id, meta_creative_id, name, status, effective_status, page_id, source_asset_kind, source_asset_url, destination_url, tracking_url, primary_text, headline, description, call_to_action_type, spend, impressions, clicks, ctr, cpc, cpm, synced_at, created_at, updated_at",
      )
      .eq("brand_id", brandId)
      .order("synced_at", { ascending: false })
      .limit(100),
  ]);

  return {
    connection: connectionRow
      ? sanitizeMetaConnection(connectionRow as Record<string, unknown>)
      : null,
    adAccounts: (adAccounts ?? []).map((account) =>
      sanitizeMetaAdAccount(account as Record<string, unknown>),
    ),
    campaigns: (campaigns ?? []).map((campaign) =>
      sanitizeMetaCampaign(campaign as Record<string, unknown>),
    ),
    adSets: (adSets ?? []).map((adSet) =>
      sanitizeMetaAdSet(adSet as Record<string, unknown>),
    ),
    ads: (ads ?? []).map((ad) => sanitizeMetaAd(ad as Record<string, unknown>)),
  };
}

export async function upsertMetaAdAccounts({
  admin,
  connectionId,
  brandId,
  adAccounts,
  selectedAccountId,
}: {
  admin: AdminClient;
  connectionId: string;
  brandId: string;
  adAccounts: MetaAdAccount[];
  selectedAccountId: string | null;
}) {
  await admin
    .from("brand_meta_ad_accounts")
    .delete()
    .eq("connection_id", connectionId);

  if (!adAccounts.length) {
    return;
  }

  const { error } = await admin.from("brand_meta_ad_accounts").insert(
    adAccounts.map((account) => ({
      connection_id: connectionId,
      brand_id: brandId,
      meta_account_id: account.id,
      account_name: account.name,
      account_status: account.status,
      currency: account.currency,
      business_id: account.business_id,
      business_name: account.business_name,
      is_selected: selectedAccountId ? account.id === selectedAccountId : false,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncMetaCampaignRows({
  admin,
  brandId,
  connection,
  adAccountId,
}: {
  admin: AdminClient;
  brandId: string;
  connection: MetaConnectionRow;
  adAccountId: string;
}) {
  const campaigns = await fetchMetaCampaigns({
    accessToken: connection.access_token,
    adAccountId,
  });

  if (campaigns.length) {
    const { error } = await admin.from("brand_meta_campaigns").upsert(
      campaigns.map((campaign: MetaCampaignSnapshot) => ({
        connection_id: connection.id,
        brand_id: brandId,
        ad_account_id: adAccountId,
        meta_campaign_id: campaign.meta_campaign_id,
        name: campaign.name,
        objective: campaign.objective,
        status: campaign.status,
        effective_status: campaign.effective_status,
        daily_budget: campaign.daily_budget,
        lifetime_budget: campaign.lifetime_budget,
        spend: campaign.spend,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        ctr: campaign.ctr,
        cpc: campaign.cpc,
        cpm: campaign.cpm,
        raw_payload: {},
        synced_at: new Date().toISOString(),
        created_at: campaign.created_at,
        updated_at: campaign.updated_at,
      })),
      {
        onConflict: "meta_campaign_id",
      },
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  const { data: localCampaignRows, error: localCampaignError } = await admin
    .from("brand_meta_campaigns")
    .select("id, meta_campaign_id, source_submission_id")
    .eq("brand_id", brandId)
    .eq("ad_account_id", adAccountId);

  if (localCampaignError) {
    throw new Error(localCampaignError.message);
  }

  await syncMetaExecutionRows({
    admin,
    brandId,
    connection,
    campaignRows: (localCampaignRows ?? []) as Array<{
      id: string;
      meta_campaign_id: string;
      source_submission_id: string | null;
    }>,
  });

  return campaigns;
}

export async function syncMetaExecutionRows({
  admin,
  brandId,
  connection,
  campaignRows,
}: {
  admin: AdminClient;
  brandId: string;
  connection: MetaConnectionRow;
  campaignRows: Array<{
    id: string;
    meta_campaign_id: string;
    source_submission_id: string | null;
  }>;
}) {
  if (!campaignRows.length) {
    return;
  }

  const [{ data: existingAdSets }, { data: existingAds }] = await Promise.all([
    admin
      .from("brand_meta_ad_sets")
      .select(
        "id, meta_ad_set_id, source_submission_id, campaign_id, meta_campaign_id",
      )
      .eq("brand_id", brandId),
    admin
      .from("brand_meta_ads")
      .select(
        "id, meta_ad_id, source_submission_id, selected_asset_id, campaign_id, ad_set_id, meta_campaign_id, meta_ad_set_id, page_id, source_asset_kind, source_asset_url, destination_url, tracking_url, primary_text, headline, description, call_to_action_type",
      )
      .eq("brand_id", brandId),
  ]);

  const existingAdSetMap = new Map(
    (existingAdSets ?? []).map((row) => [row.meta_ad_set_id as string, row]),
  );
  const existingAdMap = new Map(
    (existingAds ?? []).map((row) => [row.meta_ad_id as string, row]),
  );

  for (const campaignRow of campaignRows) {
    const adSets = await fetchMetaAdSets({
      accessToken: connection.access_token,
      campaignId: campaignRow.meta_campaign_id,
    });

    const syncedAt = new Date().toISOString();

    if (adSets.length) {
      const { error: adSetError } = await admin.from("brand_meta_ad_sets").upsert(
        adSets.map((adSet: MetaAdSetSnapshot) => {
          const existingAdSet = existingAdSetMap.get(adSet.meta_ad_set_id);

          return {
            connection_id: connection.id,
            campaign_id: campaignRow.id,
            brand_id: brandId,
            source_submission_id:
              (existingAdSet?.source_submission_id as string | null | undefined) ??
              campaignRow.source_submission_id,
            meta_campaign_id: campaignRow.meta_campaign_id,
            meta_ad_set_id: adSet.meta_ad_set_id,
            name: adSet.name,
            status: adSet.status,
            effective_status: adSet.effective_status,
            destination_type: adSet.destination_type,
            billing_event: adSet.billing_event,
            optimization_goal: adSet.optimization_goal,
            daily_budget: adSet.daily_budget,
            spend: adSet.spend,
            impressions: adSet.impressions,
            clicks: adSet.clicks,
            ctr: adSet.ctr,
            cpc: adSet.cpc,
            cpm: adSet.cpm,
            targeting_countries: adSet.targeting_countries,
            raw_payload: {},
            synced_at: syncedAt,
            created_at: adSet.created_at,
            updated_at: adSet.updated_at,
          };
        }),
        {
          onConflict: "meta_ad_set_id",
        },
      );

      if (adSetError) {
        throw new Error(adSetError.message);
      }
    }

    const { data: localAdSets, error: localAdSetsError } = await admin
      .from("brand_meta_ad_sets")
      .select("id, meta_ad_set_id, source_submission_id")
      .eq("brand_id", brandId)
      .eq("campaign_id", campaignRow.id);

    if (localAdSetsError) {
      throw new Error(localAdSetsError.message);
    }

    const localAdSetMap = new Map(
      (localAdSets ?? []).map((row) => [row.meta_ad_set_id as string, row]),
    );

    for (const adSet of adSets) {
      const localAdSet = localAdSetMap.get(adSet.meta_ad_set_id);

      if (!localAdSet) {
        continue;
      }

      const ads = await fetchMetaAds({
        accessToken: connection.access_token,
        adSetId: adSet.meta_ad_set_id,
      });

      if (!ads.length) {
        continue;
      }

      const { error: adError } = await admin.from("brand_meta_ads").upsert(
        ads.map((ad: MetaAdSnapshot) => {
          const existingAd = existingAdMap.get(ad.meta_ad_id);

          return {
            connection_id: connection.id,
            campaign_id: campaignRow.id,
            ad_set_id: localAdSet.id,
            brand_id: brandId,
            source_submission_id:
              (existingAd?.source_submission_id as string | null | undefined) ??
              (localAdSet.source_submission_id as string | null | undefined) ??
              campaignRow.source_submission_id,
            selected_asset_id:
              (existingAd?.selected_asset_id as string | null | undefined) ?? null,
            meta_campaign_id: campaignRow.meta_campaign_id,
            meta_ad_set_id: adSet.meta_ad_set_id,
            meta_ad_id: ad.meta_ad_id,
            meta_creative_id: ad.meta_creative_id,
            name: ad.name,
            status: ad.status,
            effective_status: ad.effective_status,
            page_id: (existingAd?.page_id as string | null | undefined) ?? null,
            source_asset_kind:
              (existingAd?.source_asset_kind as string | null | undefined) ?? null,
            source_asset_url:
              (existingAd?.source_asset_url as string | null | undefined) ?? null,
            destination_url:
              (existingAd?.destination_url as string | null | undefined) ?? null,
            tracking_url:
              (existingAd?.tracking_url as string | null | undefined) ?? null,
            primary_text:
              (existingAd?.primary_text as string | null | undefined) ?? null,
            headline: (existingAd?.headline as string | null | undefined) ?? null,
            description:
              (existingAd?.description as string | null | undefined) ?? null,
            call_to_action_type:
              (existingAd?.call_to_action_type as string | null | undefined) ?? null,
            spend: ad.spend,
            impressions: ad.impressions,
            clicks: ad.clicks,
            ctr: ad.ctr,
            cpc: ad.cpc,
            cpm: ad.cpm,
            raw_payload: {},
            synced_at: syncedAt,
            created_at: ad.created_at,
            updated_at: ad.updated_at,
          };
        }),
        {
          onConflict: "meta_ad_id",
        },
      );

      if (adError) {
        throw new Error(adError.message);
      }
    }
  }
}

export async function syncAllMetaCampaignRows({
  admin,
  brandId,
  connection,
  adAccounts,
  selectedAccountId,
}: {
  admin: AdminClient;
  brandId: string;
  connection: MetaConnectionRow;
  adAccounts: MetaAdAccount[];
  selectedAccountId: string | null;
}) {
  const selectedAccount =
    adAccounts.find((account) => account.id === selectedAccountId) ??
    adAccounts[0] ??
    null;

  for (const account of adAccounts) {
    await syncMetaCampaignRows({
      admin,
      brandId,
      connection,
      adAccountId: account.id,
    });
  }

  const { error: connectionError } = await admin
    .from("brand_meta_connections")
    .update({
      business_id: selectedAccount?.business_id ?? null,
      business_name: selectedAccount?.business_name ?? null,
      ad_account_id: selectedAccount?.id ?? null,
      ad_account_name: selectedAccount?.name ?? null,
      status: selectedAccount ? "connected" : "pending",
      last_error: selectedAccount ? null : "No Meta ad accounts are available.",
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", connection.id);

  if (connectionError) {
    throw new Error(connectionError.message);
  }

  return selectedAccount;
}
