import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const allowedEventNames = new Set([
  "page_viewed",
  "product_viewed",
  "product_added_to_cart",
  "checkout_started",
  "checkout_completed",
]);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503, headers: corsHeaders },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
      trackingToken?: string;
      eventName?: string;
      eventId?: string | null;
      clientId?: string | null;
      sessionId?: string | null;
      shopDomain?: string | null;
      orderId?: string | null;
      pageUrl?: string | null;
      landingUrl?: string | null;
      referrerUrl?: string | null;
      currency?: string | null;
      value?: number | string | null;
      utm?: {
        source?: string | null;
        medium?: string | null;
        campaign?: string | null;
        content?: string | null;
        term?: string | null;
      } | null;
      identifiers?: {
        fbclid?: string | null;
        fbc?: string | null;
        fbp?: string | null;
      } | null;
      circl?: {
        campaignId?: string | null;
        submissionId?: string | null;
        metaCampaignId?: string | null;
      } | null;
      payload?: unknown;
    }
    | null;

  const trackingToken = body?.trackingToken?.trim() ?? "";
  const eventName = body?.eventName?.trim() ?? "";

  if (!trackingToken || !allowedEventNames.has(eventName)) {
    return NextResponse.json(
      { error: "Invalid tracking payload." },
      { status: 400, headers: corsHeaders },
    );
  }

  const { data: settings } = await admin
    .from("brand_store_analytics_settings")
    .select("brand_id, connection_id")
    .eq("public_tracking_token", trackingToken)
    .maybeSingle();

  if (!settings) {
    return NextResponse.json(
      { error: "Tracking token not found." },
      { status: 404, headers: corsHeaders },
    );
  }

  const numericValue =
    typeof body?.value === "number"
      ? body.value
      : typeof body?.value === "string" && body.value.trim()
        ? Number(body.value)
        : null;

  let isValidConversion = true;
  if (eventName === "checkout_completed") {
    const firstSeenAt =
      (body?.payload as any)?.attribution?.firstTouch?.first_seen_at ||
      (body?.payload as any)?.attribution?.firstTouch?.firstSeenAt;

    if (firstSeenAt) {
      const clickTime = new Date(firstSeenAt).getTime();
      // const now = Date.now();

      // const diffHours = (now - clickTime) / (1000 * 60 * 60);
      const orderTime =
        (body?.payload as any)?.timestamp
          ? new Date((body?.payload as any).timestamp).getTime()
          : Date.now();

      const diffHours = (orderTime - clickTime) / (1000 * 60 * 60);
      if (diffHours > 24) {
        isValidConversion = false;
      }
    }
  }
  const { error } = await admin.from("brand_store_analytics_events").insert({
    brand_id: settings.brand_id,
    connection_id: settings.connection_id,
    event_name: eventName,
    event_id: body?.eventId?.trim() || null,
    client_id: body?.clientId?.trim() || null,
    session_id: body?.sessionId?.trim() || null,
    shop_domain: body?.shopDomain?.trim() || null,
    shop_order_id: body?.orderId?.trim() || null,
    campaign_id: body?.circl?.campaignId?.trim() || null,
    submission_id: body?.circl?.submissionId?.trim() || null,
    meta_campaign_id: body?.circl?.metaCampaignId?.trim() || null,
    page_url: body?.pageUrl?.trim() || null,
    landing_url: body?.landingUrl?.trim() || null,
    referrer_url: body?.referrerUrl?.trim() || null,
    currency: body?.currency?.trim() || null,
    value:
      eventName === "checkout_completed" && !isValidConversion
        ? null
        : Number.isFinite(numericValue as number)
          ? numericValue
          : null,
    utm_source: body?.utm?.source?.trim() || null,
    utm_medium: body?.utm?.medium?.trim() || null,
    utm_campaign: body?.utm?.campaign?.trim() || null,
    utm_content: body?.utm?.content?.trim() || null,
    utm_term: body?.utm?.term?.trim() || null,
    fbclid: body?.identifiers?.fbclid?.trim() || null,
    fbc: body?.identifiers?.fbc?.trim() || null,
    fbp: body?.identifiers?.fbp?.trim() || null,
    event_payload:
      body?.payload && typeof body.payload === "object" ? body.payload : {},
    // is_attributed: isValidConversion,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: corsHeaders },
    );
  }

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: corsHeaders },
  );
}
