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

type MetaAdSetResponse = {
  id?: string;
  name?: string;
  status?: string;
  effective_status?: string;
  daily_budget?: string;
  billing_event?: string;
  optimization_goal?: string;
  destination_type?: string;
  targeting?: {
    geo_locations?: {
      countries?: string[];
    } | null;
  } | null;
  created_time?: string;
  updated_time?: string;
};

type MetaAdResponse = {
  id?: string;
  name?: string;
  status?: string;
  effective_status?: string;
  creative?: {
    id?: string;
  } | null;
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

export type MetaAdSetSnapshot = {
  meta_ad_set_id: string;
  name: string;
  status: string | null;
  effective_status: string | null;
  destination_type: string | null;
  billing_event: string | null;
  optimization_goal: string | null;
  daily_budget: number | null;
  targeting_countries: string[];
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number | null;
  cpm: number | null;
  created_at: string;
  updated_at: string;
};

export type MetaAdSnapshot = {
  meta_ad_id: string;
  meta_creative_id: string | null;
  name: string;
  status: string | null;
  effective_status: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number | null;
  cpm: number | null;
  created_at: string;
  updated_at: string;
};

type MetaCreateResponse = {
  id?: string;
} & MetaGraphErrorPayload;

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

function normalizeMetaAdAccountId(adAccountId: string) {
  return adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
}

function readCountries(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((country): country is string => typeof country === "string");
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
  const accountId = normalizeMetaAdAccountId(adAccountId);

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
  const accountId = normalizeMetaAdAccountId(adAccountId);

  const payload = await requestMetaGraph<MetaCreateResponse>(
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

export async function fetchMetaAdSets({
  accessToken,
  campaignId,
}: {
  accessToken: string;
  campaignId: string;
}) {
  const payload = await requestMetaGraph<MetaListResponse<MetaAdSetResponse>>(
    `${campaignId}/adsets`,
    {
      accessToken,
      searchParams: {
        fields:
          "id,name,status,effective_status,daily_budget,billing_event,optimization_goal,destination_type,targeting,created_time,updated_time",
        limit: "50",
      },
    },
  );

  const adSets = payload.data ?? [];
  const insightMap = new Map<string, MetaInsightResponse>();

  await Promise.all(
    adSets.map(async (adSet) => {
      if (!adSet.id) {
        return;
      }

      try {
        const insights = await requestMetaGraph<MetaListResponse<MetaInsightResponse>>(
          `${adSet.id}/insights`,
          {
            accessToken,
            searchParams: {
              fields: "spend,impressions,clicks,ctr,cpc,cpm",
              date_preset: "last_30d",
              limit: "1",
            },
          },
        );

        insightMap.set(adSet.id, insights.data?.[0] ?? {});
      } catch {
        insightMap.set(adSet.id, {});
      }
    }),
  );

  return adSets
    .map((adSet): MetaAdSetSnapshot | null => {
      if (!adSet.id) {
        return null;
      }

      const insight = insightMap.get(adSet.id) ?? {};

      return {
        meta_ad_set_id: adSet.id,
        name: adSet.name?.trim() || "Meta ad set",
        status: adSet.status ?? null,
        effective_status: adSet.effective_status ?? null,
        destination_type: adSet.destination_type ?? null,
        billing_event: adSet.billing_event ?? null,
        optimization_goal: adSet.optimization_goal ?? null,
        daily_budget: readNumber(adSet.daily_budget),
        targeting_countries: readCountries(
          adSet.targeting?.geo_locations?.countries ?? [],
        ),
        spend: readNumber(insight.spend) ?? 0,
        impressions: readNumber(insight.impressions) ?? 0,
        clicks: readNumber(insight.clicks) ?? 0,
        ctr: readNumber(insight.ctr) ?? 0,
        cpc: readNumber(insight.cpc),
        cpm: readNumber(insight.cpm),
        created_at: adSet.created_time ?? new Date().toISOString(),
        updated_at:
          adSet.updated_time ?? adSet.created_time ?? new Date().toISOString(),
      };
    })
    .filter((adSet): adSet is MetaAdSetSnapshot => adSet !== null);
}

export async function fetchMetaAds({
  accessToken,
  adSetId,
}: {
  accessToken: string;
  adSetId: string;
}) {
  const payload = await requestMetaGraph<MetaListResponse<MetaAdResponse>>(
    `${adSetId}/ads`,
    {
      accessToken,
      searchParams: {
        fields: "id,name,status,effective_status,creative{id},created_time,updated_time",
        limit: "50",
      },
    },
  );

  const ads = payload.data ?? [];
  const insightMap = new Map<string, MetaInsightResponse>();

  await Promise.all(
    ads.map(async (ad) => {
      if (!ad.id) {
        return;
      }

      try {
        const insights = await requestMetaGraph<MetaListResponse<MetaInsightResponse>>(
          `${ad.id}/insights`,
          {
            accessToken,
            searchParams: {
              fields: "spend,impressions,clicks,ctr,cpc,cpm",
              date_preset: "last_30d",
              limit: "1",
            },
          },
        );

        insightMap.set(ad.id, insights.data?.[0] ?? {});
      } catch {
        insightMap.set(ad.id, {});
      }
    }),
  );

  return ads
    .map((ad): MetaAdSnapshot | null => {
      if (!ad.id) {
        return null;
      }

      const insight = insightMap.get(ad.id) ?? {};

      return {
        meta_ad_id: ad.id,
        meta_creative_id: ad.creative?.id ?? null,
        name: ad.name?.trim() || "Meta ad",
        status: ad.status ?? null,
        effective_status: ad.effective_status ?? null,
        spend: readNumber(insight.spend) ?? 0,
        impressions: readNumber(insight.impressions) ?? 0,
        clicks: readNumber(insight.clicks) ?? 0,
        ctr: readNumber(insight.ctr) ?? 0,
        cpc: readNumber(insight.cpc),
        cpm: readNumber(insight.cpm),
        created_at: ad.created_time ?? new Date().toISOString(),
        updated_at: ad.updated_time ?? ad.created_time ?? new Date().toISOString(),
      };
    })
    .filter((ad): ad is MetaAdSnapshot => ad !== null);
}

export async function createMetaAdSet(params: {
  accessToken: string;
  adAccountId: string;
  campaignId: string;
  name: string;
  status: "ACTIVE" | "PAUSED";
  dailyBudgetMinorUnits: number;
  countries: string[];
  billingEvent?: string;
  optimizationGoal?: string;
  destinationType?: string;
}) {
  const accountId = normalizeMetaAdAccountId(params.adAccountId);

  const payload = await requestMetaGraph<MetaCreateResponse>(`${accountId}/adsets`, {
    accessToken: params.accessToken,
    method: "POST",
    body: {
      name: params.name,
      campaign_id: params.campaignId,
      daily_budget: String(Math.max(100, Math.round(params.dailyBudgetMinorUnits))),
      billing_event: params.billingEvent ?? "IMPRESSIONS",
      optimization_goal: params.optimizationGoal ?? "LINK_CLICKS",
      destination_type: params.destinationType ?? "WEBSITE",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      targeting: JSON.stringify({
        geo_locations: {
          countries: params.countries,
        },
      }),
      status: params.status,
    },
  });

  if (!payload.id) {
    throw new Error("Meta did not return an ad set id.");
  }

  return payload.id;
}

export async function uploadMetaVideoFromUrl(params: {
  accessToken: string;
  adAccountId: string;
  name: string;
  videoUrl: string;
}) {
  const accountId = normalizeMetaAdAccountId(params.adAccountId);

  const payload = await requestMetaGraph<MetaCreateResponse>(
    `${accountId}/advideos`,
    {
      accessToken: params.accessToken,
      method: "POST",
      body: {
        name: params.name,
        file_url: params.videoUrl,
      },
    },
  );

  if (!payload.id) {
    throw new Error("Meta did not return a video id.");
  }

  return payload.id;
}

export async function createMetaImageAdCreative(params: {
  accessToken: string;
  adAccountId: string;
  name: string;
  pageId: string;
  linkUrl: string;
  imageUrl: string;
  headline: string;
  message: string;
  description?: string | null;
  callToActionType?: string | null;
}) {
  const accountId = normalizeMetaAdAccountId(params.adAccountId);
  const objectStorySpec = {
    page_id: params.pageId,
    link_data: {
      link: params.linkUrl,
      image_url: params.imageUrl,
      message: params.message,
      name: params.headline,
      description: params.description ?? undefined,
      call_to_action: {
        type: params.callToActionType ?? "LEARN_MORE",
        value: {
          link: params.linkUrl,
        },
      },
    },
  };

  const payload = await requestMetaGraph<MetaCreateResponse>(
    `${accountId}/adcreatives`,
    {
      accessToken: params.accessToken,
      method: "POST",
      body: {
        name: params.name,
        object_story_spec: JSON.stringify(objectStorySpec),
      },
    },
  );

  if (!payload.id) {
    throw new Error("Meta did not return a creative id.");
  }

  return payload.id;
}

export async function createMetaVideoAdCreative(params: {
  accessToken: string;
  adAccountId: string;
  name: string;
  pageId: string;
  linkUrl: string;
  videoId: string;
  headline: string;
  message: string;
  description?: string | null;
  callToActionType?: string | null;
}) {
  const accountId = normalizeMetaAdAccountId(params.adAccountId);
  const objectStorySpec = {
    page_id: params.pageId,
    video_data: {
      video_id: params.videoId,
      message: params.message,
      title: params.headline,
      link_description: params.description ?? undefined,
      call_to_action: {
        type: params.callToActionType ?? "LEARN_MORE",
        value: {
          link: params.linkUrl,
        },
      },
      link: params.linkUrl,
    },
  };

  const payload = await requestMetaGraph<MetaCreateResponse>(
    `${accountId}/adcreatives`,
    {
      accessToken: params.accessToken,
      method: "POST",
      body: {
        name: params.name,
        object_story_spec: JSON.stringify(objectStorySpec),
      },
    },
  );

  if (!payload.id) {
    throw new Error("Meta did not return a creative id.");
  }

  return payload.id;
}

export async function createMetaAd(params: {
  accessToken: string;
  adAccountId: string;
  adSetId: string;
  creativeId: string;
  name: string;
  status: "ACTIVE" | "PAUSED";
}) {
  const accountId = normalizeMetaAdAccountId(params.adAccountId);

  const payload = await requestMetaGraph<MetaCreateResponse>(`${accountId}/ads`, {
    accessToken: params.accessToken,
    method: "POST",
    body: {
      name: params.name,
      adset_id: params.adSetId,
      creative: JSON.stringify({
        creative_id: params.creativeId,
      }),
      status: params.status,
    },
  });

  if (!payload.id) {
    throw new Error("Meta did not return an ad id.");
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

export async function updateMetaAdSetStatus({
  accessToken,
  adSetId,
  status,
}: {
  accessToken: string;
  adSetId: string;
  status: "ACTIVE" | "PAUSED";
}) {
  await requestMetaGraph<MetaGraphErrorPayload>(adSetId, {
    accessToken,
    method: "POST",
    body: {
      status,
    },
  });
}

export async function updateMetaAdStatus({
  accessToken,
  adId,
  status,
}: {
  accessToken: string;
  adId: string;
  status: "ACTIVE" | "PAUSED";
}) {
  await requestMetaGraph<MetaGraphErrorPayload>(adId, {
    accessToken,
    method: "POST",
    body: {
      status,
    },
  });
}
