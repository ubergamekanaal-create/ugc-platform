import { NextResponse } from "next/server";
import { buildAttributedOrderFromWebhook, verifyShopifyWebhookSignature } from "@/lib/integrations/shopify-webhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);

  const connectionId = searchParams.get("connectionId");
  const admin = createAdminClient();
  const signature = request.headers.get("x-shopify-hmac-sha256");
  const shopDomain = request.headers.get("x-shopify-shop-domain")?.trim() || "";
  const topic = request.headers.get("x-shopify-topic")?.trim() || "";
  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Shopify signature header." },
      { status: 400 },
    );
  }

  if (!shopDomain) {
    return NextResponse.json(
      { error: "Missing Shopify shop domain header." },
      { status: 400 },
    );
  }

  const payloadText = await request.text();
  try {
    if (!verifyShopifyWebhookSignature({ payload: payloadText, signature })) {
      return NextResponse.json(
        { error: "Unable to verify Shopify webhook signature." },
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify Shopify webhook signature.",
      },
      { status: 503 },
    );
  }

  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(payloadText) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid Shopify webhook payload." },
      { status: 400 },
    );
  }

  const { data: connection } = await admin
    .from("brand_store_connections")
    .select("id, brand_id, store_domain")
    .eq("store_domain", shopDomain)
    .eq("id", connectionId)
    .maybeSingle();

  if (!connection) {
    return NextResponse.json({ received: true, ignored: true });
  }
  const orderId = (payload as any)?.id;
  let matchedEvent = null;

  for (let i = 0; i < 5; i++) {
    const { data, error } = await admin
      .from("brand_store_analytics_events")
      .select("*")
      .eq("shop_domain", shopDomain)
      .eq("event_name", "checkout_completed")
      .eq("shop_order_id", orderId)
      .maybeSingle();

    if (data) {
      matchedEvent = data;
      break;
    }

    await new Promise((res) => setTimeout(res, 1000));
  }

  if (!matchedEvent) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const orderTime = new Date((payload as any).created_at).getTime();
  const clickTime = new Date(
    matchedEvent.event_payload?.attribution?.lastTouch?.last_seen_at
  ).getTime();
  if (!clickTime) {
    return NextResponse.json({ received: true, ignored: true });
  }
  const diffHours = (orderTime - clickTime) / (1000 * 60 * 60);

  if (diffHours > 24) {
    return NextResponse.json({ received: true, ignored: true });
  }
  const attribution = matchedEvent;

  const enrichedAttribution = {
    utm_source: attribution?.utm_source || null,
    utm_medium: attribution?.utm_medium || null,
    utm_campaign: attribution?.utm_campaign || null,
    utm_content: attribution?.utm_content || null,
    utm_term: attribution?.utm_term || null,

    campaign_id: attribution?.campaign_id || null,
    submission_id: attribution?.submission_id || null,
    meta_campaign_id: attribution?.meta_campaign_id || null,

    fbclid: attribution?.fbclid || null,
    fbc: attribution?.fbc || null,
    fbp: attribution?.fbp || null,
  };
  try {
    // const order = buildAttributedOrderFromWebhook({
    //   brandId: connection.brand_id,
    //   connectionId: connection.id,
    //   shopDomain,
    //   payload,
    // });
    const baseOrder = buildAttributedOrderFromWebhook({
      brandId: connection.brand_id,
      connectionId: connection.id,
      shopDomain,
      payload,
    });

    const order = {
      ...baseOrder,
      utm_source: enrichedAttribution.utm_source,
      utm_medium: enrichedAttribution.utm_medium,
      utm_campaign: enrichedAttribution.utm_campaign,
      utm_content: enrichedAttribution.utm_content,
      utm_term: enrichedAttribution.utm_term,

      campaign_id: enrichedAttribution.campaign_id,
      submission_id: enrichedAttribution.submission_id,
      meta_campaign_id: enrichedAttribution.meta_campaign_id,

      fbclid: enrichedAttribution.fbclid,
      fbc: enrichedAttribution.fbc,
      fbp: enrichedAttribution.fbp,
    };
    const { error: upsertError } = await admin
      .from("brand_store_attributed_orders")
      .upsert(order, {
        onConflict: "shop_domain,shop_order_id",
      });

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    const { error: connectionUpdateError } = await admin
      .from("brand_store_connections")
      .update({
        analytics_webhook_status: "configured",
        last_webhook_at: new Date().toISOString(),
        last_webhook_error: null,
      })
      .eq("id", connection.id);

    if (connectionUpdateError) {
      throw new Error(connectionUpdateError.message);
    }

    return NextResponse.json({ received: true, topic });
  } catch (error) {
    await admin
      .from("brand_store_connections")
      .update({
        analytics_webhook_status: "error",
        last_webhook_error:
          error instanceof Error
            ? error.message
            : "Unable to process Shopify webhook.",
      })
      .eq("id", connection.id);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process Shopify webhook.",
      },
      { status: 500 },
    );
  }
}
