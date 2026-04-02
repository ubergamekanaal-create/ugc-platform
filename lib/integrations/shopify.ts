import type {
  BrandStoreProduct,
  StoreConnectionStatus,
  StoreProvider,
} from "@/lib/types";

const SHOPIFY_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2026-01";

type ShopifyCatalogResult = {
  storeName: string;
  storeDomain: string;
  storeUrl: string;
  apiVersion: string;
  status: StoreConnectionStatus;
  products: Array<
    Omit<BrandStoreProduct, "id" | "connection_id" | "brand_id">
  >;
};

type ShopifyGraphQLError = {
  message?: string;
};

type ShopifyGraphQLResponse<T> = {
  data?: T;
  errors?: ShopifyGraphQLError[];
};

function safeString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function safeNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function resolveStoreProvider(value: unknown): StoreProvider | null {
  return value === "shopify" ||
    value === "non_shopify" ||
    value === "headless_shopify"
    ? value
    : null;
}

export function normalizeStoreUrl(input: string, provider: StoreProvider) {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Store URL is required.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withProtocol);
  const host = url.hostname.toLowerCase();

  if (
    (provider === "shopify" || provider === "headless_shopify") &&
    !host.endsWith(".myshopify.com")
  ) {
    throw new Error(
      "Use your Shopify admin domain ending in .myshopify.com.",
    );
  }

  return {
    storeDomain: host,
    storeUrl: `${url.protocol}//${host}`,
  };
}

export async function runShopifyAdminGraphql<T>(params: {
  storeDomain: string;
  accessToken: string;
  query: string;
  variables?: Record<string, unknown>;
}) {
  const response = await fetch(
    `https://${params.storeDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": params.accessToken,
      },
      body: JSON.stringify({
        query: params.query,
        variables: params.variables ?? {},
      }),
      cache: "no-store",
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | ShopifyGraphQLResponse<T>
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.errors?.[0]?.message ??
        "Unable to connect to Shopify. Check your admin API token.",
    );
  }

  if (payload?.errors?.length) {
    throw new Error(
      payload.errors[0]?.message ??
        "Shopify returned an error while processing the request.",
    );
  }

  if (!payload?.data) {
    throw new Error("Shopify did not return any data.");
  }

  return payload.data;
}

export async function registerShopifyAnalyticsWebhooks(params: {
  storeDomain: string;
  accessToken: string;
  callbackUrl: string;
}) {
  const mutation = `#graphql
    mutation RegisterWebhook($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
      webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
        webhookSubscription {
          id
          topic
          uri
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const includeFields = [
    "id",
    "admin_graphql_api_id",
    "name",
    "created_at",
    "currency",
    "current_subtotal_price",
    "current_total_price",
    "current_total_tax",
    "total_shipping_price_set",
    "total_discounts",
    "financial_status",
    "fulfillment_status",
    "contact_email",
    "landing_site",
    "referring_site",
    "source_name",
    "browser_ip",
  ];

  const topics = ["ORDERS_CREATE", "ORDERS_PAID", "ORDERS_UPDATED"] as const;
  const subscriptions: Array<{ id: string; topic: string; uri: string }> = [];

  for (const topic of topics) {
    const data = await runShopifyAdminGraphql<{
      webhookSubscriptionCreate?: {
        webhookSubscription?: {
          id?: string;
          topic?: string;
          uri?: string;
        } | null;
        userErrors?: Array<{ message?: string }>;
      };
    }>({
      storeDomain: params.storeDomain,
      accessToken: params.accessToken,
      query: mutation,
      variables: {
        topic,
        webhookSubscription: {
          uri: params.callbackUrl,
          includeFields,
        },
      },
    });

    const result = data.webhookSubscriptionCreate;
    const errorMessage = result?.userErrors?.find((error) => error.message)?.message;

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    if (!result?.webhookSubscription?.id) {
      throw new Error(`Shopify did not return a webhook id for ${topic}.`);
    }

    subscriptions.push({
      id: result.webhookSubscription.id,
      topic: result.webhookSubscription.topic ?? topic,
      uri: result.webhookSubscription.uri ?? params.callbackUrl,
    });
  }

  return subscriptions;
}

export async function fetchShopifyCatalog(params: {
  provider: StoreProvider;
  storeUrl: string;
  accessToken: string;
}) {
  const { provider, storeUrl, accessToken } = params;
  const normalized = normalizeStoreUrl(storeUrl, provider);
  const query = `#graphql
    query GetStoreCatalog {
      shop {
        name
        myshopifyDomain
      }
      products(first: 12, sortKey: UPDATED_AT, reverse: true) {
        nodes {
          id
          title
          handle
          vendor
          productType
          status
          featuredImage {
            url
          }
          priceRangeV2 {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          updatedAt
        }
      }
    }
  `;

  const payload = await runShopifyAdminGraphql<{
    shop?: { name?: string; myshopifyDomain?: string };
    products?: {
      nodes?: Array<Record<string, unknown>>;
    };
  }>({
    storeDomain: normalized.storeDomain,
    accessToken,
    query,
  });

  const storeName = payload.shop?.name?.trim();
  const storeDomain =
    payload.shop?.myshopifyDomain?.trim() ?? normalized.storeDomain;

  if (!storeName) {
    throw new Error(
      "Shopify did not return store details. Make sure the token has read_products access.",
    );
  }

  const products = (payload.products?.nodes ?? []).map((node) => ({
    external_product_id: safeString(node.id) ?? crypto.randomUUID(),
    title: safeString(node.title) ?? "Untitled product",
    handle: safeString(node.handle),
    vendor: safeString(node.vendor),
    product_type: safeString(node.productType),
    image_url:
      node.featuredImage &&
      typeof node.featuredImage === "object" &&
      "url" in node.featuredImage
        ? safeString(node.featuredImage.url)
        : null,
    status: safeString(node.status),
    price:
      node.priceRangeV2 &&
      typeof node.priceRangeV2 === "object" &&
      "minVariantPrice" in node.priceRangeV2 &&
      node.priceRangeV2.minVariantPrice &&
      typeof node.priceRangeV2.minVariantPrice === "object" &&
      "amount" in node.priceRangeV2.minVariantPrice
        ? safeNumber(node.priceRangeV2.minVariantPrice.amount)
        : null,
    currency:
      node.priceRangeV2 &&
      typeof node.priceRangeV2 === "object" &&
      "minVariantPrice" in node.priceRangeV2 &&
      node.priceRangeV2.minVariantPrice &&
      typeof node.priceRangeV2.minVariantPrice === "object" &&
      "currencyCode" in node.priceRangeV2.minVariantPrice
        ? safeString(node.priceRangeV2.minVariantPrice.currencyCode)
        : null,
    synced_at: new Date().toISOString(),
  }));

  return {
    storeName,
    storeDomain,
    storeUrl: normalized.storeUrl,
    apiVersion: SHOPIFY_API_VERSION,
    status: "connected",
    products,
  } satisfies ShopifyCatalogResult;
}
