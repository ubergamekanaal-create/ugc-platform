"use client";

import { type FormEvent, useEffect, useState } from "react";
import { BrandMetaPanel } from "@/components/dashboard/brand-meta-panel";
import { MotionScale } from "@/components/shared/motion";
import type {
  BrandStoreConnectionSummary,
  BrandStoreProduct,
  StoreProvider,
} from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type IntegrationResponse = {
  connection: BrandStoreConnectionSummary | null;
  products: BrandStoreProduct[];
  message?: string;
  error?: string;
};

type ProviderCard = {
  provider: StoreProvider;
  title: string;
  description: string;
  icon: string;
};

const providerCards: ProviderCard[] = [
  {
    provider: "shopify",
    title: "Shopify Store",
    description: "Standard Shopify storefront",
    icon: "S",
  },
  {
    provider: "non_shopify",
    title: "Non-Shopify Store",
    description: "WooCommerce, BigCommerce, custom, etc.",
    icon: "◎",
  },
  {
    provider: "headless_shopify",
    title: "Headless Shopify",
    description: "Custom frontend with Shopify backend",
    icon: "H",
  },
];

const initialForm = {
  storeUrl: "",
  accessToken: "",
  storefrontAccessToken: "",
};

function getTokenLabel(provider: StoreProvider) {
  return provider === "shopify" || provider === "headless_shopify"
    ? "Admin API access token"
    : "API access token";
}

export function BrandIntegrationsPanel() {
  const [selectedProvider, setSelectedProvider] = useState<StoreProvider>("shopify");
  const [form, setForm] = useState(initialForm);
  const [connection, setConnection] =
    useState<BrandStoreConnectionSummary | null>(null);
  const [products, setProducts] = useState<BrandStoreProduct[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  async function loadConnection() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/integrations/store", {
        cache: "no-store",
      });
      const payload = (await response.json()) as IntegrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load integrations.");
      }

      setConnection(payload.connection);
      setProducts(payload.products);

      if (payload.connection) {
        setSelectedProvider(payload.connection.provider);
        setForm((current) => ({
          ...current,
          storeUrl: current.storeUrl || payload.connection?.store_url || "",
        }));
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load integrations.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadConnection();
  }, []);

  async function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/integrations/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedProvider,
          storeUrl: form.storeUrl,
          accessToken: form.accessToken,
          storefrontAccessToken:
            selectedProvider === "headless_shopify"
              ? form.storefrontAccessToken
              : null,
        }),
      });
      const payload = (await response.json()) as IntegrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to connect your store.");
      }

      setConnection(payload.connection);
      setProducts(payload.products);
      setMessage(payload.message ?? "Store connected.");
      setForm((current) => ({
        ...current,
        accessToken: "",
        storefrontAccessToken: "",
      }));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to connect your store.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSync() {
    setMessage(null);
    setIsSyncing(true);

    try {
      const response = await fetch("/api/integrations/store/sync", {
        method: "POST",
      });
      const payload = (await response.json()) as IntegrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to sync products.");
      }

      setConnection(payload.connection);
      setProducts(payload.products);
      setMessage(payload.message ?? "Products synced.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to sync products.",
      );
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleDisconnect() {
    setMessage(null);
    setIsDisconnecting(true);

    try {
      const response = await fetch("/api/integrations/store", {
        method: "DELETE",
      });
      const payload = (await response.json()) as IntegrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to disconnect store.");
      }

      setConnection(null);
      setProducts([]);
      setMessage(payload.message ?? "Store disconnected.");
      setForm(initialForm);
      setSelectedProvider("shopify");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to disconnect store.",
      );
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div>
          <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
            E-commerce Store Connection
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-500">
            Connect your store to import products, track attribution, and keep
            campaign briefs tied to real catalog data. Tokens are stored
            server-side and never sent back to the browser.
          </p>
        </div>

        <div className="mt-10">
          <p className="text-lg font-semibold text-slate-950">
            How is your e-commerce store set up?
          </p>
          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {providerCards.map((card) => {
              const isActive = selectedProvider === card.provider;

              return (
                <button
                  key={card.provider}
                  type="button"
                  onClick={() => setSelectedProvider(card.provider)}
                  className={cn(
                    "rounded-[1.75rem] border p-6 text-left transition",
                    isActive
                      ? "border-accent/30 bg-blue-50 shadow-[0_14px_30px_rgba(7,107,210,0.08)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-semibold",
                        card.provider === "shopify"
                          ? "bg-[#95bf47]/15 text-[#78a22f]"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {card.icon}
                    </span>
                    <div>
                      <p className="text-2xl font-semibold text-slate-950">
                        {card.title}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {card.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleConnect}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="integration-store-url"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Store URL
              </label>
              <input
                id="integration-store-url"
                required
                value={form.storeUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    storeUrl: event.target.value,
                  }))
                }
                placeholder={
                  selectedProvider === "shopify" ||
                  selectedProvider === "headless_shopify"
                    ? "brand-name.myshopify.com"
                    : "store.yourbrand.com"
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
            <div>
              <label
                htmlFor="integration-access-token"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                {getTokenLabel(selectedProvider)}
              </label>
              <input
                id="integration-access-token"
                type="password"
                required
                value={form.accessToken}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    accessToken: event.target.value,
                  }))
                }
                placeholder="Paste your token"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
          </div>

          {selectedProvider === "headless_shopify" ? (
            <div>
              <label
                htmlFor="integration-storefront-token"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Storefront access token
              </label>
              <input
                id="integration-storefront-token"
                type="password"
                required
                value={form.storefrontAccessToken}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    storefrontAccessToken: event.target.value,
                  }))
                }
                placeholder="Required for headless Shopify"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-slate-500">
              {connection ? (
                <div className="space-y-1">
                  <p>
                    Connected store:{" "}
                    <span className="font-medium text-slate-700">
                      {connection.store_name ?? connection.store_domain}
                    </span>
                  </p>
                  <p>
                    Last synced:{" "}
                    {connection.last_synced_at
                      ? formatDate(connection.last_synced_at)
                      : "Not synced yet"}
                  </p>
                </div>
              ) : (
                <p>
                  Connect once, then sync products on demand without re-entering
                  the token.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {connection ? (
                <>
                  <MotionScale
                    type="button"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSyncing ? "Syncing..." : "Sync products"}
                  </MotionScale>
                  <MotionScale
                    type="button"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                  </MotionScale>
                </>
              ) : null}
              <MotionScale
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Connecting..." : "Connect Store"}
              </MotionScale>
            </div>
          </div>

          {message ? <p className="text-sm text-slate-500">{message}</p> : null}
        </form>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
              Synced Products
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Preview the latest catalog items imported from your connected
              store.
            </p>
          </div>
          {connection ? (
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
                connection.status === "connected"
                  ? "bg-emerald-50 text-emerald-700"
                  : connection.status === "error"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-100 text-slate-600",
              )}
            >
              {connection.status}
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-[1.5rem] border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
        ) : products.length ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white"
              >
                <div className="aspect-[1.5/1] bg-slate-100">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {product.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {product.vendor ?? "Unknown vendor"}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {product.status ?? "synced"}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">
                    <p>{product.product_type ?? "Uncategorized"}</p>
                    <p className="mt-1">
                      {product.price !== null
                        ? formatCurrency(product.price)
                        : "Price unavailable"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
            {connection
              ? "No products have been synced yet. Run a sync or reconnect with a token that can read products."
              : "Connect your store to import products into CIRCL."}
          </div>
        )}
      </section>

      <BrandMetaPanel mode="integrations" />
    </div>
  );
}
