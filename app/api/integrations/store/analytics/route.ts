import { NextResponse } from "next/server";
import {
  buildStoreAnalyticsInstallBundle,
  sanitizeStoreAnalyticsEvent,
  sanitizeStoreAttributedOrder,
  sanitizeStoreAnalyticsSettings,
  summarizeAttributedOrders,
  summarizeStoreAnalyticsEvents,
} from "@/lib/integrations/store-analytics";
import {
  sanitizeStoreConnection,
} from "@/lib/integrations/store-connections";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireBrandUser() {
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
        { error: "Only brand accounts can manage store analytics." },
        { status: 403 },
      ),
    };
  }

  return { brandId: user.id };
}

function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost && forwardedProto) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

async function readAnalyticsPayload(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  brandId: string,
  request: Request,
) {
  const [
    { data: rawConnection },
    { data: rawSettings },
    { data: rawEvents },
    { data: rawOrders },
  ] =
    await Promise.all([
      admin
        .from("brand_store_connections")
        .select(
          "id, brand_id, provider, store_name, store_url, store_domain, access_token, storefront_access_token, api_version, status, analytics_webhook_status, analytics_webhooks_registered_at, last_webhook_at, last_webhook_error, product_count, connected_at, last_synced_at",
        )
        .eq("brand_id", brandId)
        .maybeSingle(),
      admin
        .from("brand_store_analytics_settings")
        .select(
          "id, brand_id, connection_id, public_tracking_token, utm_source_default, utm_medium_default, utm_campaign_prefix, utm_term_default, enable_page_view, enable_product_view, enable_add_to_cart, enable_checkout_started, enable_checkout_completed, created_at, updated_at",
        )
        .eq("brand_id", brandId)
        .maybeSingle(),
      admin
        .from("brand_store_analytics_events")
        .select(
          "id, brand_id, connection_id, event_name, event_id, client_id, session_id, shop_domain, shop_order_id, campaign_id, submission_id, meta_campaign_id, page_url, landing_url, referrer_url, referral_code, currency, value, utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, fbc, fbp, created_at",
        )
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false })
        .limit(20),
      admin
        .from("brand_store_attributed_orders")
        .select(
          "id, brand_id, connection_id, shop_domain, shop_order_id, shopify_order_gid, order_name, customer_email, financial_status, fulfillment_status, source_name, currency, subtotal, discount_total, shipping_total, tax_total, total, landing_url, referrer_url, referral_code, utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, fbc, fbp, campaign_id, submission_id, meta_campaign_id, ordered_at, created_at, updated_at",
        )
        .eq("brand_id", brandId)
        .order("ordered_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  const connection = rawConnection
    ? sanitizeStoreConnection(rawConnection as Record<string, unknown>)
    : null;
  const settings = rawSettings
    ? sanitizeStoreAnalyticsSettings(rawSettings as Record<string, unknown>)
    : null;
  const recentEvents = (rawEvents ?? []).map((event) =>
    sanitizeStoreAnalyticsEvent(event as Record<string, unknown>),
  );
  const recentOrders = (rawOrders ?? []).map((order) =>
    sanitizeStoreAttributedOrder(order as Record<string, unknown>),
  );
  const eventSummary = summarizeStoreAnalyticsEvents(recentEvents);
  const orderSummary = summarizeAttributedOrders(recentOrders);

  return {
    connection,
    settings,
    summary: {
      ...eventSummary,
      orders: orderSummary.orders,
      tracked_orders: orderSummary.tracked_orders,
      attributed_revenue: orderSummary.revenue,
    },
    recentEvents,
    recentOrders,
    install:
      settings !== null
        ? buildStoreAnalyticsInstallBundle({
            origin: getRequestOrigin(request),
            settings,
            previewDestinationUrl: connection?.store_url ?? null,
          })
        : null,
  };
}

async function ensureSettings(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  brandId: string,
) {
  const [{ data: rawConnection }, { data: rawSettings }] = await Promise.all([
    admin
      .from("brand_store_connections")
      .select("id")
      .eq("brand_id", brandId)
      .maybeSingle(),
    admin
      .from("brand_store_analytics_settings")
      .select(
        "id, brand_id, connection_id, public_tracking_token, utm_source_default, utm_medium_default, utm_campaign_prefix, utm_term_default, enable_page_view, enable_product_view, enable_add_to_cart, enable_checkout_started, enable_checkout_completed, created_at, updated_at",
      )
      .eq("brand_id", brandId)
      .maybeSingle(),
  ]);

  const connectionId =
    rawConnection && typeof rawConnection === "object" && "id" in rawConnection
      ? (rawConnection.id as string)
      : null;

  if (!rawSettings) {
    const { data: inserted, error } = await admin
      .from("brand_store_analytics_settings")
      .insert({
        brand_id: brandId,
        connection_id: connectionId,
      })
      .select(
        "id, brand_id, connection_id, public_tracking_token, utm_source_default, utm_medium_default, utm_campaign_prefix, utm_term_default, enable_page_view, enable_product_view, enable_add_to_cart, enable_checkout_started, enable_checkout_completed, created_at, updated_at",
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return sanitizeStoreAnalyticsSettings(inserted as Record<string, unknown>);
  }

  const settings = sanitizeStoreAnalyticsSettings(rawSettings as Record<string, unknown>);

  if (connectionId && settings.connection_id !== connectionId) {
    const { data: updated, error } = await admin
      .from("brand_store_analytics_settings")
      .update({ connection_id: connectionId })
      .eq("id", settings.id)
      .select(
        "id, brand_id, connection_id, public_tracking_token, utm_source_default, utm_medium_default, utm_campaign_prefix, utm_term_default, enable_page_view, enable_product_view, enable_add_to_cart, enable_checkout_started, enable_checkout_completed, created_at, updated_at",
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return sanitizeStoreAnalyticsSettings(updated as Record<string, unknown>);
  }

  return settings;
}

export async function GET(request: Request) {
  const brand = await requireBrandUser();

  if ("error" in brand) {
    return brand.error;
  }

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  await ensureSettings(admin, brand.brandId);
  const payload = await readAnalyticsPayload(admin, brand.brandId, request);

  return NextResponse.json(payload);
}

export async function PATCH(request: Request) {
  const brand = await requireBrandUser();

  if ("error" in brand) {
    return brand.error;
  }

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  const current = await ensureSettings(admin, brand.brandId);
  const body = (await request.json().catch(() => null)) as
    | {
        utmSourceDefault?: string;
        utmMediumDefault?: string;
        utmCampaignPrefix?: string;
        utmTermDefault?: string | null;
        enablePageView?: boolean;
        enableProductView?: boolean;
        enableAddToCart?: boolean;
        enableCheckoutStarted?: boolean;
        enableCheckoutCompleted?: boolean;
      }
    | null;

  const { error } = await admin
    .from("brand_store_analytics_settings")
    .update({
      utm_source_default:
        body?.utmSourceDefault?.trim() || current.utm_source_default,
      utm_medium_default:
        body?.utmMediumDefault?.trim() || current.utm_medium_default,
      utm_campaign_prefix:
        body?.utmCampaignPrefix?.trim() || current.utm_campaign_prefix,
      utm_term_default: body?.utmTermDefault?.trim() || null,
      enable_page_view:
        typeof body?.enablePageView === "boolean"
          ? body.enablePageView
          : current.enable_page_view,
      enable_product_view:
        typeof body?.enableProductView === "boolean"
          ? body.enableProductView
          : current.enable_product_view,
      enable_add_to_cart:
        typeof body?.enableAddToCart === "boolean"
          ? body.enableAddToCart
          : current.enable_add_to_cart,
      enable_checkout_started:
        typeof body?.enableCheckoutStarted === "boolean"
          ? body.enableCheckoutStarted
          : current.enable_checkout_started,
      enable_checkout_completed:
        typeof body?.enableCheckoutCompleted === "boolean"
          ? body.enableCheckoutCompleted
          : current.enable_checkout_completed,
    })
    .eq("id", current.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const payload = await readAnalyticsPayload(admin, brand.brandId, request);

  return NextResponse.json({
    ...payload,
    message: "Store analytics settings updated.",
  });
}
