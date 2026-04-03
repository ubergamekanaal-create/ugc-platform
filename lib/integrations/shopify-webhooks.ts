import crypto from "node:crypto";
import { parseTrackedAttribution } from "@/lib/analytics/tracking";

function readString(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function readNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (
    value &&
    typeof value === "object" &&
    "shop_money" in value &&
    value.shop_money &&
    typeof value.shop_money === "object" &&
    "amount" in value.shop_money
  ) {
    return readNumber(value.shop_money.amount);
  }

  return null;
}

function normalizeUrl(value: string | null, shopDomain: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).toString();
  } catch {
    try {
      return new URL(value, `https://${shopDomain}`).toString();
    } catch {
      return null;
    }
  }
}

export function getShopifyWebhookSecret() {
  return process.env.SHOPIFY_WEBHOOK_SECRET?.trim() || "";
}

export function verifyShopifyWebhookSignature(params: {
  payload: string;
  signature: string;
}) {
  const secret = getShopifyWebhookSecret();

  if (!secret) {
    throw new Error("Missing SHOPIFY_WEBHOOK_SECRET.");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(params.payload, "utf8")
    .digest("base64");

  const signatureBuffer = Buffer.from(params.signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

export function buildAttributedOrderFromWebhook(params: {
  brandId: string;
  connectionId: string;
  shopDomain: string;
  payload: Record<string, unknown>;
}) {
  const landingUrl = normalizeUrl(
    readString(params.payload.landing_site),
    params.shopDomain,
  );
  const referrerUrl = normalizeUrl(
    readString(params.payload.referring_site),
    params.shopDomain,
  );
  const attribution = parseTrackedAttribution(landingUrl);

  return {
    brand_id: params.brandId,
    connection_id: params.connectionId,
    shop_domain: params.shopDomain,
    shop_order_id:
      readString(params.payload.id) ??
      readString(params.payload.order_number) ??
      readString(params.payload.name) ??
      crypto.randomUUID(),
    shopify_order_gid: readString(params.payload.admin_graphql_api_id),
    order_name: readString(params.payload.name),
    customer_email: readString(params.payload.contact_email),
    financial_status: readString(params.payload.financial_status),
    fulfillment_status: readString(params.payload.fulfillment_status),
    source_name: readString(params.payload.source_name),
    currency: readString(params.payload.currency),
    subtotal: readNumber(params.payload.current_subtotal_price),
    discount_total: readNumber(params.payload.total_discounts),
    shipping_total: readNumber(params.payload.total_shipping_price_set),
    tax_total: readNumber(params.payload.current_total_tax),
    total: readNumber(params.payload.current_total_price),
    landing_url: landingUrl,
    referrer_url: referrerUrl,
    referral_code: null,
    utm_source: attribution?.utm_source ?? null,
    utm_medium: attribution?.utm_medium ?? null,
    utm_campaign: attribution?.utm_campaign ?? null,
    utm_content: attribution?.utm_content ?? null,
    utm_term: attribution?.utm_term ?? null,
    fbclid: attribution?.fbclid ?? null,
    fbc: null,
    fbp: null,
    campaign_id: attribution?.circl_campaign_id ?? null,
    submission_id: attribution?.circl_submission_id ?? null,
    meta_campaign_id: attribution?.circl_meta_campaign_id ?? null,
    ordered_at:
      readString(params.payload.processed_at) ??
      readString(params.payload.created_at),
    raw_payload: params.payload,
  };
}
