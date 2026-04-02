import {
  buildTrackedUrl,
  generateShopifyCustomPixelCode,
  type StoreAnalyticsEventName,
} from "@/lib/analytics/tracking";
import type {
  BrandStoreAnalyticsEvent,
  BrandStoreAttributedOrder,
  BrandStoreAnalyticsSettings,
} from "@/lib/types";

export type StoreAnalyticsSettingsRow = {
  id: string;
  brand_id: string;
  connection_id: string | null;
  public_tracking_token: string;
  utm_source_default: string;
  utm_medium_default: string;
  utm_campaign_prefix: string;
  utm_term_default: string | null;
  enable_page_view: boolean;
  enable_product_view: boolean;
  enable_add_to_cart: boolean;
  enable_checkout_started: boolean;
  enable_checkout_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type StoreAttributedOrderRow = {
  id: string;
  brand_id: string;
  connection_id: string | null;
  shop_domain: string;
  shop_order_id: string;
  shopify_order_gid: string | null;
  order_name: string | null;
  customer_email: string | null;
  financial_status: string | null;
  fulfillment_status: string | null;
  source_name: string | null;
  currency: string | null;
  subtotal: number | string | null;
  discount_total: number | string | null;
  shipping_total: number | string | null;
  tax_total: number | string | null;
  total: number | string | null;
  landing_url: string | null;
  referrer_url: string | null;
  referral_code: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  campaign_id: string | null;
  submission_id: string | null;
  meta_campaign_id: string | null;
  ordered_at: string | null;
  created_at: string;
  updated_at: string;
};

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function readNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readEventName(value: unknown): StoreAnalyticsEventName {
  return value === "product_viewed" ||
    value === "product_added_to_cart" ||
    value === "checkout_started" ||
    value === "checkout_completed"
    ? value
    : "page_viewed";
}

export function sanitizeStoreAnalyticsSettings(
  row: Record<string, unknown>,
): BrandStoreAnalyticsSettings {
  return {
    id: readString(row.id),
    brand_id: readString(row.brand_id),
    connection_id: readNullableString(row.connection_id),
    public_tracking_token: readString(row.public_tracking_token),
    utm_source_default: readString(row.utm_source_default, "circl"),
    utm_medium_default: readString(row.utm_medium_default, "paid_social"),
    utm_campaign_prefix: readString(row.utm_campaign_prefix, "creator"),
    utm_term_default: readNullableString(row.utm_term_default),
    enable_page_view: readBoolean(row.enable_page_view, true),
    enable_product_view: readBoolean(row.enable_product_view, true),
    enable_add_to_cart: readBoolean(row.enable_add_to_cart, true),
    enable_checkout_started: readBoolean(row.enable_checkout_started, true),
    enable_checkout_completed: readBoolean(row.enable_checkout_completed, true),
    created_at: readString(row.created_at, new Date().toISOString()),
    updated_at: readString(row.updated_at, new Date().toISOString()),
  };
}

export function sanitizeStoreAnalyticsEvent(
  row: Record<string, unknown>,
): BrandStoreAnalyticsEvent {
  return {
    id: readString(row.id),
    brand_id: readString(row.brand_id),
    connection_id: readNullableString(row.connection_id),
    event_name: readEventName(row.event_name),
    event_id: readNullableString(row.event_id),
    client_id: readNullableString(row.client_id),
    session_id: readNullableString(row.session_id),
    shop_domain: readNullableString(row.shop_domain),
    shop_order_id: readNullableString(row.shop_order_id),
    campaign_id: readNullableString(row.campaign_id),
    submission_id: readNullableString(row.submission_id),
    meta_campaign_id: readNullableString(row.meta_campaign_id),
    page_url: readNullableString(row.page_url),
    landing_url: readNullableString(row.landing_url),
    referrer_url: readNullableString(row.referrer_url),
    referral_code: readNullableString(row.referral_code),
    currency: readNullableString(row.currency),
    value: readNumber(row.value),
    utm_source: readNullableString(row.utm_source),
    utm_medium: readNullableString(row.utm_medium),
    utm_campaign: readNullableString(row.utm_campaign),
    utm_content: readNullableString(row.utm_content),
    utm_term: readNullableString(row.utm_term),
    fbclid: readNullableString(row.fbclid),
    fbc: readNullableString(row.fbc),
    fbp: readNullableString(row.fbp),
    created_at: readString(row.created_at, new Date().toISOString()),
  };
}

export function sanitizeStoreAttributedOrder(
  row: Record<string, unknown>,
): BrandStoreAttributedOrder {
  return {
    id: readString(row.id),
    brand_id: readString(row.brand_id),
    connection_id: readNullableString(row.connection_id),
    shop_domain: readString(row.shop_domain),
    shop_order_id: readString(row.shop_order_id),
    shopify_order_gid: readNullableString(row.shopify_order_gid),
    order_name: readNullableString(row.order_name),
    customer_email: readNullableString(row.customer_email),
    financial_status: readNullableString(row.financial_status),
    fulfillment_status: readNullableString(row.fulfillment_status),
    source_name: readNullableString(row.source_name),
    currency: readNullableString(row.currency),
    subtotal: readNumber(row.subtotal),
    discount_total: readNumber(row.discount_total),
    shipping_total: readNumber(row.shipping_total),
    tax_total: readNumber(row.tax_total),
    total: readNumber(row.total),
    landing_url: readNullableString(row.landing_url),
    referrer_url: readNullableString(row.referrer_url),
    referral_code: readNullableString(row.referral_code),
    utm_source: readNullableString(row.utm_source),
    utm_medium: readNullableString(row.utm_medium),
    utm_campaign: readNullableString(row.utm_campaign),
    utm_content: readNullableString(row.utm_content),
    utm_term: readNullableString(row.utm_term),
    fbclid: readNullableString(row.fbclid),
    fbc: readNullableString(row.fbc),
    fbp: readNullableString(row.fbp),
    campaign_id: readNullableString(row.campaign_id),
    submission_id: readNullableString(row.submission_id),
    meta_campaign_id: readNullableString(row.meta_campaign_id),
    ordered_at: readNullableString(row.ordered_at),
    created_at: readString(row.created_at, new Date().toISOString()),
    updated_at: readString(row.updated_at, new Date().toISOString()),
  };
}

export function summarizeStoreAnalyticsEvents(events: BrandStoreAnalyticsEvent[]) {
  return events.reduce(
    (summary, event) => {
      summary.total_events += 1;

      if (event.event_name === "page_viewed") {
        summary.page_views += 1;
      } else if (event.event_name === "product_viewed") {
        summary.product_views += 1;
      } else if (event.event_name === "product_added_to_cart") {
        summary.add_to_cart += 1;
      } else if (event.event_name === "checkout_started") {
        summary.checkout_started += 1;
      } else if (event.event_name === "checkout_completed") {
        summary.purchases += 1;
        summary.revenue += event.value ?? 0;
      }

      return summary;
    },
    {
      total_events: 0,
      page_views: 0,
      product_views: 0,
      add_to_cart: 0,
      checkout_started: 0,
      purchases: 0,
      revenue: 0,
    },
  );
}

export function summarizeAttributedOrders(orders: BrandStoreAttributedOrder[]) {
  return orders.reduce(
    (summary, order) => {
      summary.orders += 1;
      summary.revenue += order.total ?? 0;

      if (order.utm_campaign) {
        summary.tracked_orders += 1;
      }

      return summary;
    },
    {
      orders: 0,
      tracked_orders: 0,
      revenue: 0,
    },
  );
}

export function buildStoreAnalyticsInstallBundle(params: {
  origin: string;
  settings: BrandStoreAnalyticsSettings;
  previewDestinationUrl?: string | null;
}) {
  const endpointUrl = `${params.origin}/api/integrations/store/analytics/collect`;
  const enabledEvents: Partial<Record<StoreAnalyticsEventName, boolean>> = {
    page_viewed: params.settings.enable_page_view,
    product_viewed: params.settings.enable_product_view,
    product_added_to_cart: params.settings.enable_add_to_cart,
    checkout_started: params.settings.enable_checkout_started,
    checkout_completed: params.settings.enable_checkout_completed,
  };

  return {
    endpointUrl,
    webhookEndpointUrl: `${params.origin}/api/integrations/store/webhooks/shopify`,
    webhookTopics: ["orders/create", "orders/paid", "orders/updated"],
    customPixelCode: generateShopifyCustomPixelCode({
      endpointUrl,
      trackingToken: params.settings.public_tracking_token,
      enabledEvents,
    }),
    previewUrl: params.previewDestinationUrl
      ? buildTrackedUrl({
          destinationUrl: params.previewDestinationUrl,
          utmSource: params.settings.utm_source_default,
          utmMedium: params.settings.utm_medium_default,
          utmCampaign: `${params.settings.utm_campaign_prefix}-preview`,
          utmTerm: params.settings.utm_term_default,
        })
      : "",
  };
}
