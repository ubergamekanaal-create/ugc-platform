import type {
  BrandStoreConnectionSummary,
  BrandStoreProduct,
  StoreConnectionStatus,
  StoreProvider,
} from "@/lib/types";

export type StoreConnectionRow = {
  id: string;
  brand_id: string;
  provider: StoreProvider;
  store_name: string | null;
  store_url: string;
  store_domain: string;
  access_token: string;
  storefront_access_token: string | null;
  api_version: string;
  status: StoreConnectionStatus;
  product_count: number;
  connected_at: string;
  last_synced_at: string | null;
};

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export function sanitizeStoreConnection(
  row: Record<string, unknown>,
): BrandStoreConnectionSummary {
  return {
    id: readString(row.id),
    provider:
      row.provider === "shopify" ||
      row.provider === "non_shopify" ||
      row.provider === "headless_shopify"
        ? row.provider
        : "shopify",
    store_name: readNullableString(row.store_name),
    store_url: readString(row.store_url),
    store_domain: readString(row.store_domain),
    api_version: readString(row.api_version),
    status:
      row.status === "connected" ||
      row.status === "pending" ||
      row.status === "error"
        ? row.status
        : "pending",
    product_count: readNumber(row.product_count),
    connected_at: readString(row.connected_at),
    last_synced_at: readNullableString(row.last_synced_at),
    has_storefront_access_token: Boolean(row.storefront_access_token),
  };
}

export function sanitizeStoreProduct(
  row: Record<string, unknown>,
): BrandStoreProduct {
  return {
    id: readString(row.id),
    connection_id: readString(row.connection_id),
    brand_id: readString(row.brand_id),
    external_product_id: readString(row.external_product_id),
    title: readString(row.title),
    handle: readNullableString(row.handle),
    vendor: readNullableString(row.vendor),
    product_type: readNullableString(row.product_type),
    image_url: readNullableString(row.image_url),
    status: readNullableString(row.status),
    price:
      row.price === null || row.price === undefined ? null : readNumber(row.price),
    currency: readNullableString(row.currency),
    synced_at: readString(row.synced_at),
  };
}
