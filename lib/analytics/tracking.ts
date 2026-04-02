export type StoreAnalyticsEventName =
  | "page_viewed"
  | "product_viewed"
  | "product_added_to_cart"
  | "checkout_started"
  | "checkout_completed";

export type TrackingUrlParams = {
  destinationUrl: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  campaignId?: string | null;
  submissionId?: string | null;
  metaCampaignId?: string | null;
};

export type ParsedTrackedAttribution = {
  landing_url: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  circl_campaign_id: string | null;
  circl_submission_id: string | null;
  circl_meta_campaign_id: string | null;
  fbclid: string | null;
};

type CustomPixelCodeParams = {
  endpointUrl: string;
  trackingToken: string;
  enabledEvents: Partial<Record<StoreAnalyticsEventName, boolean>>;
};

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function readQueryValue(url: URL, key: string) {
  const value = url.searchParams.get(key);
  return hasText(value) ? value!.trim() : null;
}

export function slugifyTrackingValue(value: string | null | undefined) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const normalized = value.trim();

  return normalized
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function buildTrackedUrl({
  destinationUrl,
  utmSource,
  utmMedium,
  utmCampaign,
  utmContent,
  utmTerm,
  campaignId,
  submissionId,
  metaCampaignId,
}: TrackingUrlParams) {
  const normalized = destinationUrl.trim();

  if (!normalized) {
    return "";
  }

  let url: URL;

  try {
    url = new URL(normalized);
  } catch {
    return "";
  }

  const params = [
    ["utm_source", utmSource],
    ["utm_medium", utmMedium],
    ["utm_campaign", utmCampaign],
    ["utm_content", utmContent],
    ["utm_term", utmTerm],
    ["circl_campaign_id", campaignId],
    ["circl_submission_id", submissionId],
    ["circl_meta_campaign_id", metaCampaignId],
  ] as const;

  params.forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      url.searchParams.set(key, value.trim());
    }
  });

  return url.toString();
}

export function parseTrackedAttribution(urlString: string | null | undefined) {
  if (!hasText(urlString)) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(urlString!.trim());
  } catch {
    return null;
  }

  return {
    landing_url: url.toString(),
    utm_source: readQueryValue(url, "utm_source"),
    utm_medium: readQueryValue(url, "utm_medium"),
    utm_campaign: readQueryValue(url, "utm_campaign"),
    utm_content: readQueryValue(url, "utm_content"),
    utm_term: readQueryValue(url, "utm_term"),
    circl_campaign_id: readQueryValue(url, "circl_campaign_id"),
    circl_submission_id: readQueryValue(url, "circl_submission_id"),
    circl_meta_campaign_id: readQueryValue(url, "circl_meta_campaign_id"),
    fbclid: readQueryValue(url, "fbclid"),
  } satisfies ParsedTrackedAttribution;
}

export function generateShopifyCustomPixelCode({
  endpointUrl,
  trackingToken,
  enabledEvents,
}: CustomPixelCodeParams) {
  const activeEvents = Object.entries(enabledEvents)
    .filter(([, enabled]) => enabled)
    .map(([eventName]) => eventName as StoreAnalyticsEventName);

  return `const CIRCL_ENDPOINT = ${JSON.stringify(endpointUrl)};
const CIRCL_TOKEN = ${JSON.stringify(trackingToken)};
const CIRCL_STORAGE_KEY = "circl_attribution_v1";
const CIRCL_EVENTS = ${JSON.stringify(activeEvents)};

function makeSessionId() {
  return [Date.now().toString(36), Math.random().toString(36).slice(2, 10)].join("-");
}

async function readAttribution() {
  const stored = await browser.localStorage.get(CIRCL_STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

async function readCookieValue(name) {
  if (!browser?.cookie?.get) {
    return null;
  }

  try {
    const value = await browser.cookie.get(name);
    return typeof value === "string" && value ? value : null;
  } catch {
    return null;
  }
}

function getQueryValue(url, key) {
  const value = url.searchParams.get(key);
  return value && value.trim() ? value.trim() : null;
}

async function readBrowserIdentifiers(url) {
  const fbclid = getQueryValue(url, "fbclid");
  const fbcCookie = await readCookieValue("_fbc");
  const fbpCookie = await readCookieValue("_fbp");
  const generatedFbc =
    fbclid && !fbcCookie
      ? ["fb", "1", Math.floor(Date.now() / 1000), fbclid].join(".")
      : null;

  return {
    fbclid,
    fbc: fbcCookie || generatedFbc,
    fbp: fbpCookie,
  };
}

async function storeAttributionFromUrl(urlString) {
  const existing = await readAttribution();

  if (!urlString) {
    return existing;
  }

  let url;

  try {
    url = new URL(urlString);
  } catch {
    return existing;
  }

  const identifiers = await readBrowserIdentifiers(url);
  const touch = {
    landing_url: url.toString(),
    utm_source: getQueryValue(url, "utm_source"),
    utm_medium: getQueryValue(url, "utm_medium"),
    utm_campaign: getQueryValue(url, "utm_campaign"),
    utm_content: getQueryValue(url, "utm_content"),
    utm_term: getQueryValue(url, "utm_term"),
    circl_campaign_id: getQueryValue(url, "circl_campaign_id"),
    circl_submission_id: getQueryValue(url, "circl_submission_id"),
    circl_meta_campaign_id: getQueryValue(url, "circl_meta_campaign_id"),
    fbclid: identifiers.fbclid,
    fbc: identifiers.fbc,
    fbp: identifiers.fbp,
  };

  const hasTracking = Object.values(touch).some((value) => Boolean(value));

  if (!hasTracking) {
    return existing;
  }

  const next = {
    session_id: existing?.session_id || makeSessionId(),
    first_seen_at: existing?.first_seen_at || new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    first_touch: existing?.first_touch || touch,
    last_touch: touch,
  };

  await browser.localStorage.set(CIRCL_STORAGE_KEY, JSON.stringify(next));
  return next;
}

function getCheckoutValue(event) {
  const amount = event?.data?.checkout?.totalPrice?.amount;
  return amount === undefined || amount === null ? null : Number(amount);
}

function getCheckoutCurrency(event) {
  return event?.data?.checkout?.currencyCode ?? null;
}

function getOrderId(event) {
  return event?.data?.checkout?.order?.id ?? null;
}

async function sendEvent(eventName, event) {
  const pageUrl =
    event?.context?.document?.location?.href ??
    init?.context?.document?.location?.href ??
    null;
  const referrerUrl =
    event?.context?.document?.referrer ??
    init?.context?.document?.referrer ??
    null;
  const attribution = await storeAttributionFromUrl(pageUrl);

  fetch(CIRCL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      trackingToken: CIRCL_TOKEN,
      eventName,
      eventId: event?.id ?? null,
      clientId: event?.clientId ?? null,
      sessionId: attribution?.session_id ?? null,
      shopDomain: init?.context?.document?.location?.host ?? null,
      pageUrl,
      referrerUrl,
      landingUrl: attribution?.last_touch?.landing_url ?? null,
      currency: getCheckoutCurrency(event),
      value: eventName === "checkout_completed" ? getCheckoutValue(event) : null,
      orderId: eventName === "checkout_completed" ? getOrderId(event) : null,
      utm: {
        source: attribution?.last_touch?.utm_source ?? null,
        medium: attribution?.last_touch?.utm_medium ?? null,
        campaign: attribution?.last_touch?.utm_campaign ?? null,
        content: attribution?.last_touch?.utm_content ?? null,
        term: attribution?.last_touch?.utm_term ?? null,
      },
      identifiers: {
        fbclid:
          attribution?.last_touch?.fbclid ?? attribution?.first_touch?.fbclid ?? null,
        fbc: attribution?.last_touch?.fbc ?? attribution?.first_touch?.fbc ?? null,
        fbp: attribution?.last_touch?.fbp ?? attribution?.first_touch?.fbp ?? null,
      },
      circl: {
        campaignId:
          attribution?.last_touch?.circl_campaign_id ??
          attribution?.first_touch?.circl_campaign_id ??
          null,
        submissionId:
          attribution?.last_touch?.circl_submission_id ??
          attribution?.first_touch?.circl_submission_id ??
          null,
        metaCampaignId:
          attribution?.last_touch?.circl_meta_campaign_id ??
          attribution?.first_touch?.circl_meta_campaign_id ??
          null,
      },
      payload: {
        timestamp: event?.timestamp ?? null,
        name: event?.name ?? eventName,
        data: event?.data ?? null,
        attribution: {
          firstTouch: attribution?.first_touch ?? null,
          lastTouch: attribution?.last_touch ?? null,
        },
      },
    }),
    keepalive: true,
  }).catch(() => {});
}

CIRCL_EVENTS.forEach((eventName) => {
  analytics.subscribe(eventName, (event) => {
    void sendEvent(eventName, event);
  });
});`;
}
