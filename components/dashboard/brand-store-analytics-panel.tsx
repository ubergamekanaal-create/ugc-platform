"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MotionScale } from "@/components/shared/motion";
import type {
  BrandStoreAnalyticsEvent,
  BrandStoreAttributedOrder,
  BrandStoreAnalyticsSettings,
  BrandStoreConnectionSummary,
} from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type StoreAnalyticsResponse = {
  connection: BrandStoreConnectionSummary | null;
  settings: BrandStoreAnalyticsSettings | null;
  summary: {
    total_events: number;
    page_views: number;
    product_views: number;
    add_to_cart: number;
    checkout_started: number;
    purchases: number;
    revenue: number;
    orders: number;
    tracked_orders: number;
    attributed_revenue: number;
  };
  recentEvents: BrandStoreAnalyticsEvent[];
  recentOrders: BrandStoreAttributedOrder[];
  install: {
    endpointUrl: string;
    webhookEndpointUrl: string;
    webhookTopics: string[];
    customPixelCode: string;
    previewUrl: string;
  } | null;
  message?: string;
  error?: string;
};

type BrandStoreAnalyticsPanelProps = {
  connection: BrandStoreConnectionSummary | null;
};

function copyText(value: string) {
  return navigator.clipboard.writeText(value);
}

export function BrandStoreAnalyticsPanel({
  connection,
}: BrandStoreAnalyticsPanelProps) {
  const [connectionInfo, setConnectionInfo] =
    useState<BrandStoreConnectionSummary | null>(connection);
  const [settings, setSettings] = useState<BrandStoreAnalyticsSettings | null>(null);
  const [summary, setSummary] = useState<StoreAnalyticsResponse["summary"] | null>(
    null,
  );
  const [recentEvents, setRecentEvents] = useState<BrandStoreAnalyticsEvent[]>([]);
  const [recentOrders, setRecentOrders] = useState<BrandStoreAttributedOrder[]>([]);
  const [install, setInstall] = useState<StoreAnalyticsResponse["install"] | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegisteringWebhooks, setIsRegisteringWebhooks] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [form, setForm] = useState({
    utmSourceDefault: "circl",
    utmMediumDefault: "paid_social",
    utmCampaignPrefix: "creator",
    utmTermDefault: "",
    enablePageView: true,
    enableProductView: true,
    enableAddToCart: true,
    enableCheckoutStarted: true,
    enableCheckoutCompleted: true,
  });

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/integrations/store/analytics", {
        cache: "no-store",
      });
      const payload = (await response.json()) as StoreAnalyticsResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load store analytics.");
      }

      setConnectionInfo(payload.connection ?? connection);
      setSettings(payload.settings);
      setSummary(payload.summary);
      setRecentEvents(payload.recentEvents);
      setRecentOrders(payload.recentOrders);
      setInstall(payload.install);
      setForm({
        utmSourceDefault: payload.settings?.utm_source_default ?? "circl",
        utmMediumDefault: payload.settings?.utm_medium_default ?? "paid_social",
        utmCampaignPrefix: payload.settings?.utm_campaign_prefix ?? "creator",
        utmTermDefault: payload.settings?.utm_term_default ?? "",
        enablePageView: payload.settings?.enable_page_view ?? true,
        enableProductView: payload.settings?.enable_product_view ?? true,
        enableAddToCart: payload.settings?.enable_add_to_cart ?? true,
        enableCheckoutStarted: payload.settings?.enable_checkout_started ?? true,
        enableCheckoutCompleted:
          payload.settings?.enable_checkout_completed ?? true,
      });
      setMessage(payload.message ?? null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load store analytics.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    setConnectionInfo(connection);
    void loadAnalytics();
  }, [connection, loadAnalytics]);

  const metrics = useMemo(
    () => [
      {
        label: "Page views",
        value: String(summary?.page_views ?? 0),
      },
      {
        label: "Product views",
        value: String(summary?.product_views ?? 0),
      },
      {
        label: "Checkouts",
        value: String(summary?.checkout_started ?? 0),
      },
      {
        label: "Tracked orders",
        value: String(summary?.tracked_orders ?? 0),
      },
      {
        label: "Attributed revenue",
        value: formatCurrency(summary?.attributed_revenue ?? 0),
      },
    ],
    [summary],
  );

  async function handleSave() {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/store/analytics", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as StoreAnalyticsResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update analytics settings.");
      }

      setSettings(payload.settings);
      setSummary(payload.summary);
      setRecentEvents(payload.recentEvents);
      setRecentOrders(payload.recentOrders);
      setConnectionInfo(payload.connection ?? connectionInfo);
      setInstall(payload.install);
      setMessage(payload.message ?? "Store analytics settings updated.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update analytics settings.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRegisterWebhooks() {
    setIsRegisteringWebhooks(true);
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/store/analytics/webhooks", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to register Shopify webhooks.");
      }

      await loadAnalytics();
      setMessage(payload.message ?? "Shopify webhooks registered.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to register Shopify webhooks.",
      );
    } finally {
      setIsRegisteringWebhooks(false);
    }
  }

  async function handleCopy(field: string, value: string) {
    try {
      await copyText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1800);
    } catch {
      setMessage("Copy failed. Select the text and copy it manually.");
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
            Store Attribution + Shopify Tracking
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-500">
            Configure default UTMs, generate the Shopify custom pixel code, and capture
            page views through completed checkouts back into CIRCL.
          </p>
        </div>
        <MotionScale
          type="button"
          onClick={() => void handleSave()}
          disabled={isLoading || isSaving}
          className="rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Tracking Settings"}
        </MotionScale>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
          >
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Default UTM source
                </label>
                <input
                  value={form.utmSourceDefault}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      utmSourceDefault: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Default UTM medium
                </label>
                <input
                  value={form.utmMediumDefault}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      utmMediumDefault: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  UTM campaign prefix
                </label>
                <input
                  value={form.utmCampaignPrefix}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      utmCampaignPrefix: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Default UTM term
                </label>
                <input
                  value={form.utmTermDefault}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      utmTermDefault: event.target.value,
                    }))
                  }
                  placeholder="Optional"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Page views", "enablePageView"],
                ["Product views", "enableProductView"],
                ["Add to cart", "enableAddToCart"],
                ["Checkout started", "enableCheckoutStarted"],
                ["Checkout completed", "enableCheckoutCompleted"],
              ].map(([label, key]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                >
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={form[key as keyof typeof form] as boolean}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [key]: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-950">Install details</p>
                <p className="mt-2 text-sm text-slate-500">
                  Paste the custom pixel code into Shopify Admin {" > "} Settings {" > "} Customer events.
                </p>
              </div>
              {settings ? (
                <MotionScale
                  type="button"
                  onClick={() =>
                    void handleCopy("token", settings.public_tracking_token)
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {copiedField === "token" ? "Copied token" : "Copy token"}
                </MotionScale>
              ) : null}
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Tracking token
                </p>
                <p className="mt-2 break-all font-medium text-slate-950">
                  {settings?.public_tracking_token ?? "Loading..."}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Event endpoint
                </p>
                <p className="mt-2 break-all font-medium text-slate-950">
                  {install?.endpointUrl ?? "Loading..."}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Preview tracked URL
                </p>
                <p className="mt-2 break-all font-medium text-slate-950">
                  {install?.previewUrl || connectionInfo?.store_url || "Connect a store first."}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Shopify webhook status
                    </p>
                    <p className="mt-2 font-medium text-slate-950">
                      {connectionInfo?.analytics_webhook_status === "configured"
                        ? "Configured"
                        : connectionInfo?.analytics_webhook_status === "error"
                          ? "Needs attention"
                          : "Not configured"}
                    </p>
                  </div>
                  <MotionScale
                    type="button"
                    onClick={() => void handleRegisterWebhooks()}
                    disabled={
                      isLoading ||
                      isRegisteringWebhooks ||
                      !connectionInfo ||
                      (connectionInfo.provider !== "shopify" &&
                        connectionInfo.provider !== "headless_shopify")
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRegisteringWebhooks ? "Registering..." : "Register webhooks"}
                  </MotionScale>
                </div>
                <p className="mt-3 break-all text-sm text-slate-500">
                  {install?.webhookEndpointUrl ?? "Webhook endpoint unavailable."}
                </p>
                {connectionInfo?.last_webhook_error ? (
                  <p className="mt-3 text-sm text-rose-600">
                    {connectionInfo.last_webhook_error}
                  </p>
                ) : connectionInfo?.last_webhook_at ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Last webhook received {formatDate(connectionInfo.last_webhook_at)}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Register Shopify order webhooks so CIRCL can store attributed
                    purchases server-side.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-950">
                  Shopify Custom Pixel Code
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  This captures UTMs on landing and posts page, product, cart, and checkout events to CIRCL.
                </p>
                {install?.webhookTopics?.length ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                    Webhooks: {install.webhookTopics.join(" • ")}
                  </p>
                ) : null}
              </div>
              {install?.customPixelCode ? (
                <MotionScale
                  type="button"
                  onClick={() =>
                    void handleCopy("pixel", install.customPixelCode ?? "")
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {copiedField === "pixel" ? "Copied code" : "Copy code"}
                </MotionScale>
              ) : null}
            </div>
            <textarea
              readOnly
              value={install?.customPixelCode ?? "Loading Shopify custom pixel code..."}
              className="mt-5 min-h-[420px] w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 font-mono text-xs leading-6 text-slate-700 outline-none"
            />
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-950">Recent tracked events</p>
                <p className="mt-2 text-sm text-slate-500">
                  Use this to verify the pixel is active and UTMs are being recorded.
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  recentEvents.length
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {recentEvents.length ? `${recentEvents.length} captured` : "No events yet"}
              </span>
            </div>

            {recentEvents.length ? (
              <div className="mt-5 space-y-3">
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {event.event_name.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {event.utm_campaign || "No UTM campaign"} • {formatDate(event.created_at)}
                        </p>
                      </div>
                      <div className="text-sm text-slate-600">
                        {event.value !== null ? formatCurrency(event.value) : "Value n/a"}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      {event.utm_source ? (
                        <span className="rounded-full bg-white px-3 py-1">
                          source: {event.utm_source}
                        </span>
                      ) : null}
                      {event.utm_medium ? (
                        <span className="rounded-full bg-white px-3 py-1">
                          medium: {event.utm_medium}
                        </span>
                      ) : null}
                      {event.utm_content ? (
                        <span className="rounded-full bg-white px-3 py-1">
                          content: {event.utm_content}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                Install the Shopify custom pixel, open a tracked landing URL, and the latest
                events will appear here.
              </div>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-950">Attributed orders</p>
                <p className="mt-2 text-sm text-slate-500">
                  Server-side Shopify orders matched back to your tracked landing URLs.
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  recentOrders.length
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {recentOrders.length ? `${recentOrders.length} orders` : "No orders yet"}
              </span>
            </div>

            {recentOrders.length ? (
              <div className="mt-5 space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950">
                          {order.order_name || order.shop_order_id}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {order.utm_campaign || "No UTM campaign"} •{" "}
                          {formatDate(order.ordered_at || order.created_at)}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-slate-700">
                        {order.total !== null ? formatCurrency(order.total) : "Total n/a"}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      {order.utm_source ? (
                        <span className="rounded-full bg-white px-3 py-1">
                          source: {order.utm_source}
                        </span>
                      ) : null}
                      {order.utm_medium ? (
                        <span className="rounded-full bg-white px-3 py-1">
                          medium: {order.utm_medium}
                        </span>
                      ) : null}
                      {order.submission_id ? (
                        <span className="rounded-full bg-white px-3 py-1">
                          linked submission
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                Register Shopify webhooks and generate orders from tracked links to
                populate attributed purchases here.
              </div>
            )}
          </div>
        </div>
      </div>

      {message ? <p className="mt-5 text-sm text-slate-500">{message}</p> : null}
    </section>
  );
}
