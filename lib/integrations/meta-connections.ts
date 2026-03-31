import { NextResponse } from "next/server";
import type {
  BrandMetaAdAccountSummary,
  BrandMetaCampaignSummary,
  BrandMetaConnectionSummary,
  MetaConnectionStatus,
} from "@/lib/types";
import type { MetaAdAccount, MetaCampaignSnapshot } from "@/lib/integrations/meta";
import { fetchMetaCampaigns } from "@/lib/integrations/meta";
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

export async function readMetaPayload(admin: AdminClient, brandId: string) {
  const { data: connectionRow } = await admin
    .from("brand_meta_connections")
    .select(
      "id, brand_id, meta_user_id, meta_user_name, business_id, business_name, ad_account_id, ad_account_name, access_token, token_expires_at, permissions, status, last_error, connected_at, last_synced_at",
    )
    .eq("brand_id", brandId)
    .maybeSingle();

  const { data: adAccounts } = await admin
    .from("brand_meta_ad_accounts")
    .select(
      "id, connection_id, brand_id, meta_account_id, account_name, account_status, currency, business_id, business_name, is_selected, created_at, updated_at",
    )
    .eq("brand_id", brandId)
    .order("is_selected", { ascending: false })
    .order("account_name", { ascending: true });

  const { data: campaigns } = await admin
    .from("brand_meta_campaigns")
    .select(
      "id, connection_id, brand_id, ad_account_id, meta_campaign_id, source_submission_id, name, objective, status, effective_status, daily_budget, lifetime_budget, spend, impressions, clicks, ctr, cpc, cpm, synced_at, created_at, updated_at",
    )
    .eq("brand_id", brandId)
    .order("synced_at", { ascending: false })
    .limit(50);

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

  return campaigns;
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
