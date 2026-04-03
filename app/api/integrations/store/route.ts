import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  fetchShopifyCatalog,
  normalizeStoreUrl,
  resolveStoreProvider,
} from "@/lib/integrations/shopify";
import {
  sanitizeStoreConnection,
  sanitizeStoreProduct,
  type StoreConnectionRow,
} from "@/lib/integrations/store-connections";

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
        { error: "Only brand accounts can manage store connections." },
        { status: 403 },
      ),
    };
  }

  return { brandId: user.id };
}

async function readConnectionPayload(admin: NonNullable<ReturnType<typeof createAdminClient>>, brandId: string) {
  const { data: connection } = await admin
    .from("brand_store_connections")
    .select(
      "id, brand_id, provider, store_name, store_url, store_domain, access_token, storefront_access_token, api_version, status, analytics_webhook_status, analytics_webhooks_registered_at, last_webhook_at, last_webhook_error, product_count, connected_at, last_synced_at",
    )
    .eq("brand_id", brandId)
    .maybeSingle();

  const { data: products } = await admin
    .from("brand_store_products")
    .select(
      "id, connection_id, brand_id, external_product_id, title, handle, vendor, product_type, image_url, status, price, currency, synced_at",
    )
    .eq("brand_id", brandId)
    .order("synced_at", { ascending: false })
    .limit(8);

  return {
    connection: connection
      ? sanitizeStoreConnection(connection as Record<string, unknown>)
      : null,
    products: (products ?? []).map((product) =>
      sanitizeStoreProduct(product as Record<string, unknown>),
    ),
  };
}

export async function GET() {
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

  const payload = await readConnectionPayload(admin, brand.brandId);

  return NextResponse.json(payload);
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

  const body = (await request.json().catch(() => null)) as
    | {
        provider?: string;
        storeUrl?: string;
        accessToken?: string;
        storefrontAccessToken?: string | null;
      }
    | null;

  const provider = resolveStoreProvider(body?.provider);
  const storeUrl = body?.storeUrl?.trim() ?? "";
  const accessToken = body?.accessToken?.trim() ?? "";
  const storefrontAccessToken = body?.storefrontAccessToken?.trim() ?? "";

  if (!provider) {
    return NextResponse.json(
      { error: "Select a supported store type first." },
      { status: 400 },
    );
  }

  if (!storeUrl || !accessToken) {
    return NextResponse.json(
      { error: "Store URL and access token are required." },
      { status: 400 },
    );
  }

  if (provider === "headless_shopify" && !storefrontAccessToken) {
    return NextResponse.json(
      { error: "Storefront access token is required for headless Shopify." },
      { status: 400 },
    );
  }

  try {
    const normalized = normalizeStoreUrl(storeUrl, provider);
    const syncedCatalog =
      provider === "shopify" || provider === "headless_shopify"
        ? await fetchShopifyCatalog({
            provider,
            storeUrl,
            accessToken,
          })
        : null;

    const { data: connectionRow, error: upsertError } = await admin
      .from("brand_store_connections")
      .upsert(
        {
          brand_id: brand.brandId,
          provider,
          store_name: syncedCatalog?.storeName ?? null,
          store_url: syncedCatalog?.storeUrl ?? normalized.storeUrl,
          store_domain: syncedCatalog?.storeDomain ?? normalized.storeDomain,
          access_token: accessToken,
          storefront_access_token:
            provider === "headless_shopify" ? storefrontAccessToken : null,
          api_version: syncedCatalog?.apiVersion ?? "custom",
          status: syncedCatalog?.status ?? "pending",
          analytics_webhook_status: "not_configured",
          analytics_webhooks_registered_at: null,
          last_webhook_at: null,
          last_webhook_error: null,
          product_count: syncedCatalog?.products.length ?? 0,
          last_synced_at: syncedCatalog ? new Date().toISOString() : null,
        },
        {
          onConflict: "brand_id",
        },
      )
      .select(
        "id, brand_id, provider, store_name, store_url, store_domain, access_token, storefront_access_token, api_version, status, analytics_webhook_status, analytics_webhooks_registered_at, last_webhook_at, last_webhook_error, product_count, connected_at, last_synced_at",
      )
      .single();

    if (upsertError || !connectionRow) {
      throw new Error(
        upsertError?.message ?? "Unable to save your store connection.",
      );
    }

    await admin
      .from("brand_store_products")
      .delete()
      .eq("brand_id", brand.brandId);

    if (syncedCatalog?.products.length) {
      const { error: productError } = await admin.from("brand_store_products").insert(
        syncedCatalog.products.map((product) => ({
          connection_id: connectionRow.id,
          brand_id: brand.brandId,
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

    const payload = await readConnectionPayload(admin, brand.brandId);

    return NextResponse.json({
      ...payload,
      message:
        syncedCatalog?.products.length
          ? `Connected ${syncedCatalog.storeName} and synced ${syncedCatalog.products.length} products.`
          : "Store connection saved. Product sync for this provider can be added next.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to connect your store.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE() {
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

  const { error } = await admin
    .from("brand_store_connections")
    .delete()
    .eq("brand_id", brand.brandId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    connection: null,
    products: [],
    message: "Store disconnected.",
  });
}
