import { NextResponse } from "next/server";
import { fetchShopifyCatalog } from "@/lib/integrations/shopify";
import {
  sanitizeStoreConnection,
  sanitizeStoreProduct,
  type StoreConnectionRow,
} from "@/lib/integrations/store-connections";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "brand") {
    return NextResponse.json(
      { error: "Only brand accounts can sync store products." },
      { status: 403 },
    );
  }

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  const { data: rawConnection } = await admin
    .from("brand_store_connections")
    .select(
      "id, brand_id, provider, store_name, store_url, store_domain, access_token, storefront_access_token, api_version, status, analytics_webhook_status, analytics_webhooks_registered_at, last_webhook_at, last_webhook_error, product_count, connected_at, last_synced_at",
    )
    .eq("brand_id", user.id)
    .maybeSingle();

  const connection = rawConnection as StoreConnectionRow | null;

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
      { error: "Automatic product sync is only available for Shopify stores." },
      { status: 400 },
    );
  }

  try {
    const catalog = await fetchShopifyCatalog({
      provider: connection.provider,
      storeUrl: connection.store_url,
      accessToken: connection.access_token,
    });

    await admin
      .from("brand_store_products")
      .delete()
      .eq("brand_id", user.id);

    if (catalog.products.length) {
      const { error: productError } = await admin.from("brand_store_products").insert(
        catalog.products.map((product) => ({
          connection_id: connection.id,
          brand_id: user.id,
          external_product_id: product.external_product_id,
          title: product.title,
          handle: product.handle,
          vendor: product.vendor,
          product_type: product.product_type,
          image_url: product.image_url,
          status: product.status,
          price: product.price,
          currency: product.currency,
          raw_payload: {},
          synced_at: product.synced_at,
        })),
      );

      if (productError) {
        throw new Error(productError.message);
      }
    }

    const { data: updatedConnection, error: updateError } = await admin
      .from("brand_store_connections")
      .update({
        store_name: catalog.storeName,
        store_url: catalog.storeUrl,
        store_domain: catalog.storeDomain,
        api_version: catalog.apiVersion,
        status: catalog.status,
        product_count: catalog.products.length,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", connection.id)
      .select(
        "id, brand_id, provider, store_name, store_url, store_domain, access_token, storefront_access_token, api_version, status, analytics_webhook_status, analytics_webhooks_registered_at, last_webhook_at, last_webhook_error, product_count, connected_at, last_synced_at",
      )
      .single();

    if (updateError || !updatedConnection) {
      throw new Error(updateError?.message ?? "Unable to update store sync.");
    }

    const { data: products } = await admin
      .from("brand_store_products")
      .select(
        "id, connection_id, brand_id, external_product_id, title, handle, vendor, product_type, image_url, status, price, currency, synced_at",
      )
      .eq("brand_id", user.id)
      .order("synced_at", { ascending: false })
      .limit(8);

    return NextResponse.json({
      connection: sanitizeStoreConnection(
        updatedConnection as Record<string, unknown>,
      ),
      products: (products ?? []).map((product) =>
        sanitizeStoreProduct(product as Record<string, unknown>),
      ),
      message: `Synced ${catalog.products.length} products from ${catalog.storeName}.`,
    });
  } catch (error) {
    await admin
      .from("brand_store_connections")
      .update({ status: "error" })
      .eq("id", connection.id);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to sync store products.",
      },
      { status: 400 },
    );
  }
}
