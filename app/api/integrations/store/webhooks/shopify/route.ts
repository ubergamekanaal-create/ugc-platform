import { NextResponse } from "next/server";
import { buildAttributedOrderFromWebhook, verifyShopifyWebhookSignature } from "@/lib/integrations/shopify-webhooks";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
    .maybeSingle();

  if (!connection) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const order = buildAttributedOrderFromWebhook({
      brandId: connection.brand_id,
      connectionId: connection.id,
      shopDomain,
      payload,
    });

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
