import { NextResponse } from "next/server";
import { registerShopifyAnalyticsWebhooks } from "@/lib/integrations/shopify";
import { getShopifyWebhookSecret } from "@/lib/integrations/shopify-webhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost && forwardedProto) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

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

export async function POST(request: Request) {
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

  if (!getShopifyWebhookSecret()) {
    return NextResponse.json(
      { error: "Missing SHOPIFY_WEBHOOK_SECRET." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
      force?: boolean;
    }
    | null;

  const { data: connection } = await admin
    .from("brand_store_connections")
    .select(
      "id, provider, store_domain, access_token, analytics_webhooks_registered_at",
    )
    .eq("brand_id", brand.brandId)
    .maybeSingle();
  if (!connection) {
    return NextResponse.json(
      { error: "Connect your store first." },
      { status: 404 },
    );
  }

  if (
    connection.provider !== "shopify" &&
    connection.provider !== "headless_shopify"
  ) {
    return NextResponse.json(
      { error: "Automatic webhook registration is only supported for Shopify stores." },
      { status: 400 },
    );
  }

  if (connection.analytics_webhooks_registered_at && body?.force !== true) {
    return NextResponse.json({
      message: "Shopify analytics webhooks are already registered for this store.",
    });
  }

  const { data: brandData } = await admin
    .from("brands")
    .select("custom_domain, domain_verified")
    .eq("user_id", brand.brandId)
    .single();

  // const callbackUrl = `${getRequestOrigin(request)}/api/integrations/store/webhooks/shopify`;
  const callbackUrl =
    brandData?.custom_domain &&
      brandData?.domain_verified
      ? `https://${brandData.custom_domain}/api/integrations/store/webhooks/shopify?connectionId=${connection.id}`
      : `${getRequestOrigin(request)}/api/integrations/store/webhooks/shopify?connectionId=${connection.id}`;
  try {
    const subscriptions = await registerShopifyAnalyticsWebhooks({
      storeDomain: connection.store_domain,
      accessToken: connection.access_token,
      callbackUrl,
    });
    if (!subscriptions.length) {
      throw new Error("No Shopify webhook subscriptions were created.");
    }
    await admin
      .from("shopify_webhook_subscriptions")
      .delete()
      .eq("connection_id", connection.id);

    const webhookRows = subscriptions.map((subscription) => ({
      connection_id: connection.id,
      shopify_webhook_id: subscription.id,
      topic: subscription.topic,
      uri: subscription.uri,
    }));

    const { error: webhookInsertError } = await admin
      .from("shopify_webhook_subscriptions")
      .insert(webhookRows);

    if (webhookInsertError) {
      throw new Error(
        `Unable to save Shopify webhook subscriptions. ${webhookInsertError.message}`,
      );
    }
    const { error: updateError } = await admin
      .from("brand_store_connections")
      .update({
        analytics_webhook_status: "configured",
        analytics_webhooks_registered_at: new Date().toISOString(),
        last_webhook_error: null,
      })
      .eq("id", connection.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      subscriptions,
      savedWebhookCount: webhookRows.length,
      message: `Registered and store ${subscriptions.length} Shopify analytics webhooks.`,
    });
  } catch (error) {
    await admin
      .from("brand_store_connections")
      .update({
        analytics_webhook_status: "error",
        last_webhook_error:
          error instanceof Error
            ? error.message
            : "Unable to register Shopify webhooks.",
      })
      .eq("id", connection.id);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to register Shopify webhooks.",
      },
      { status: 400 },
    );
  }
}
