type MetaGraphErrorPayload = {
  error?: {
    message?: string;
    code?: number;
    error_subcode?: number;
    type?: string;
  };
};

type MetaListResponse<T> = {
  data?: T[];
} & MetaGraphErrorPayload;

type MetaUserResponse = {
  id?: string;
  name?: string;
} & MetaGraphErrorPayload;

type MetaAdAccountResponse = {
  id?: string;
  account_id?: string;
  name?: string;
  account_status?: number | string;
  currency?: string;
  business?: {
    id?: string;
    name?: string;
  } | null;
};

type MetaCampaignResponse = {
  id?: string;
  name?: string;
  objective?: string;
  status?: string;
  effective_status?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time?: string;
  updated_time?: string;
};

type MetaInsightResponse = {
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
};

type MetaTokenExchangeResponse = {
  access_token?: string;
  expires_in?: number;
} & MetaGraphErrorPayload;

export type MetaAdAccount = {
  id: string;
  name: string;
  status: string | null;
  currency: string | null;
  business_id: string | null;
  business_name: string | null;
};

export type MetaCampaignSnapshot = {
  meta_campaign_id: string;
  name: string;
  objective: string | null;
  status: string | null;
  effective_status: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number | null;
  cpm: number | null;
  created_at: string;
  updated_at: string;
};

function readNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getMetaGraphApiVersion() {
  return process.env.META_GRAPH_API_VERSION ?? "v21.0";
}

function getMetaAppId() {
  return process.env.META_APP_ID ?? "";
}

function getMetaAppSecret() {
  return process.env.META_APP_SECRET ?? "";
}

function normalizeMetaError(payload: MetaGraphErrorPayload, fallback: string) {
  const message = payload.error?.message?.trim();
  return message || fallback;
}

async function requestMetaGraph<T extends MetaGraphErrorPayload>(
  path: string,
  options: {
    accessToken?: string;
    method?: "GET" | "POST";
    searchParams?: Record<string, string | null | undefined>;
    body?: Record<string, string | null | undefined>;
    baseUrl?: string;
  } = {},
) {
  const versionedPath = path.replace(/^\/+/, "");
  const baseUrl =
    options.baseUrl ?? `https://graph.facebook.com/${getMetaGraphApiVersion()}`;
  const url = new URL(`${baseUrl}/${versionedPath}`);

  Object.entries(options.searchParams ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const method = options.method ?? "GET";
  let body: URLSearchParams | undefined;

  if (method === "GET") {
    if (options.accessToken) {
      url.searchParams.set("access_token", options.accessToken);
    }
  } else {
    body = new URLSearchParams();

    Object.entries(options.body ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        body?.set(key, value);
      }
    });

    if (options.accessToken) {
      body.set("access_token", options.accessToken);
    }
  }

  const response = await fetch(url.toString(), {
    method,
    body,
    headers:
      method === "POST"
        ? {
            "Content-Type": "application/x-www-form-urlencoded",
          }
        : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as T;

  if (!response.ok || payload.error) {
    throw new Error(normalizeMetaError(payload, "Meta request failed."));
  }

  return payload;
}

export function ensureMetaConfig() {
  if (!getMetaAppId() || !getMetaAppSecret()) {
    throw new Error("Missing META_APP_ID or META_APP_SECRET.");
  }
}

export function normalizeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/dashboard")) {
    return "/dashboard/integrations";
  }

  return value;
}

export function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost && forwardedProto) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

export function getMetaRedirectUri(origin: string) {
  return `${origin}/api/integrations/meta/callback`;
}

export function buildMetaAuthUrl({
  redirectUri,
  state,
}: {
  redirectUri: string;
  state: string;
}) {
  ensureMetaConfig();

  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", getMetaAppId());
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set(
    "scope",
    "ads_management,ads_read,business_management",
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeMetaCodeForAccessToken({
  code,
  redirectUri,
}: {
  code: string;
  redirectUri: string;
}) {
  ensureMetaConfig();

  const shortLived = await requestMetaGraph<MetaTokenExchangeResponse>(
    "oauth/access_token",
    {
      baseUrl: `https://graph.facebook.com/${getMetaGraphApiVersion()}`,
      searchParams: {
        client_id: getMetaAppId(),
        client_secret: getMetaAppSecret(),
        redirect_uri: redirectUri,
        code,
      },
    },
  );

  if (!shortLived.access_token) {
    throw new Error("Meta did not return an access token.");
  }

  const longLived = await requestMetaGraph<MetaTokenExchangeResponse>(
    "oauth/access_token",
    {
      baseUrl: `https://graph.facebook.com/${getMetaGraphApiVersion()}`,
      searchParams: {
        grant_type: "fb_exchange_token",
        client_id: getMetaAppId(),
        client_secret: getMetaAppSecret(),
        fb_exchange_token: shortLived.access_token,
      },
    },
  );

  return {
    accessToken: longLived.access_token ?? shortLived.access_token,
    expiresIn: longLived.expires_in ?? shortLived.expires_in ?? null,
  };
}

export async function fetchMetaUser(accessToken: string) {
  const payload = await requestMetaGraph<MetaUserResponse>("me", {
    accessToken,
    searchParams: {
      fields: "id,name",
    },
  });

  return {
    id: payload.id ?? "",
    name: payload.name ?? null,
  };
}

export async function fetchMetaAdAccounts(accessToken: string) {
  const payload = await requestMetaGraph<MetaListResponse<MetaAdAccountResponse>>(
    "me/adaccounts",
    {
      accessToken,
      searchParams: {
        fields: "id,account_id,name,account_status,currency,business{id,name}",
        limit: "50",
      },
    },
  );

  return (payload.data ?? [])
    .map((account): MetaAdAccount | null => {
      const id = account.id ?? account.account_id ?? "";

      if (!id) {
        return null;
      }

      return {
        id: id.startsWith("act_") ? id : `act_${id}`,
        name: account.name?.trim() || id,
        status:
          account.account_status === null || account.account_status === undefined
            ? null
            : String(account.account_status),
        currency: account.currency ?? null,
        business_id: account.business?.id ?? null,
        business_name: account.business?.name ?? null,
      };
    })
    .filter((account): account is MetaAdAccount => account !== null);
}

export async function fetchMetaCampaigns({
  accessToken,
  adAccountId,
}: {
  accessToken: string;
  adAccountId: string;
}) {
  const accountId = adAccountId.startsWith("act_")
    ? adAccountId
    : `act_${adAccountId}`;

  const payload = await requestMetaGraph<MetaListResponse<MetaCampaignResponse>>(
    `${accountId}/campaigns`,
    {
      accessToken,
      searchParams: {
        fields:
          "id,name,objective,status,effective_status,daily_budget,lifetime_budget,created_time,updated_time",
        limit: "25",
      },
    },
  );

  const campaigns = payload.data ?? [];

  const insightMap = new Map<string, MetaInsightResponse>();

  await Promise.all(
    campaigns.map(async (campaign) => {
      if (!campaign.id) {
        return;
      }

      try {
        const insights = await requestMetaGraph<MetaListResponse<MetaInsightResponse>>(
          `${campaign.id}/insights`,
          {
            accessToken,
            searchParams: {
              fields: "spend,impressions,clicks,ctr,cpc,cpm",
              date_preset: "last_30d",
              limit: "1",
            },
          },
        );

        insightMap.set(campaign.id, insights.data?.[0] ?? {});
      } catch {
        insightMap.set(campaign.id, {});
      }
    }),
  );

  return campaigns
    .map((campaign): MetaCampaignSnapshot | null => {
      if (!campaign.id) {
        return null;
      }

      const insight = insightMap.get(campaign.id) ?? {};

      return {
        meta_campaign_id: campaign.id,
        name: campaign.name?.trim() || "Meta campaign",
        objective: campaign.objective ?? null,
        status: campaign.status ?? null,
        effective_status: campaign.effective_status ?? null,
        daily_budget: readNumber(campaign.daily_budget),
        lifetime_budget: readNumber(campaign.lifetime_budget),
        spend: readNumber(insight.spend) ?? 0,
        impressions: readNumber(insight.impressions) ?? 0,
        clicks: readNumber(insight.clicks) ?? 0,
        ctr: readNumber(insight.ctr) ?? 0,
        cpc: readNumber(insight.cpc),
        cpm: readNumber(insight.cpm),
        created_at: campaign.created_time ?? new Date().toISOString(),
        updated_at:
          campaign.updated_time ??
          campaign.created_time ??
          new Date().toISOString(),
      };
    })
    .filter((campaign): campaign is MetaCampaignSnapshot => campaign !== null);
}

export async function createMetaCampaign({
  accessToken,
  adAccountId,
  name,
  objective,
  status,
}: {
  accessToken: string;
  adAccountId: string;
  name: string;
  objective: string;
  status: "ACTIVE" | "PAUSED";
}) {
  const accountId = adAccountId.startsWith("act_")
    ? adAccountId
    : `act_${adAccountId}`;

  const payload = await requestMetaGraph<{ id?: string } & MetaGraphErrorPayload>(
    `${accountId}/campaigns`,
    {
      accessToken,
      method: "POST",
      body: {
        name,
        objective,
        status,
        special_ad_categories: "[]",
      },
    },
  );

  if (!payload.id) {
    throw new Error("Meta did not return a campaign id.");
  }

  return payload.id;
}

export async function updateMetaCampaignStatus({
  accessToken,
  campaignId,
  status,
}: {
  accessToken: string;
  campaignId: string;
  status: "ACTIVE" | "PAUSED";
}) {
  await requestMetaGraph<MetaGraphErrorPayload>(campaignId, {
    accessToken,
    method: "POST",
    body: {
      status,
    },
  });
}
