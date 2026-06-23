"use client";

import { type FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BrandMetaPanel } from "@/components/dashboard/brand-meta-panel";
import { BrandStoreAnalyticsPanel } from "@/components/dashboard/brand-store-analytics-panel";
import { MotionScale } from "@/components/shared/motion";
import type {
  BrandStoreConnectionSummary,
  BrandStoreProduct,
  StoreProvider,
} from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { ProductTable } from "../shared/product-table";
import { Pagination } from "../shared/pagination";
import { CustomDomainSetupModal } from "@/components/modals/custom-domain-setup-modal";
import { ConfirmationModal } from "@/components/modals/confirmation-modal";
import { connected } from "process";
type IntegrationResponse = {
  connection: BrandStoreConnectionSummary | null;
  products: BrandStoreProduct[];
  message?: string;
  error?: string;
  brand?: {
    id: string;
    full_name: string;
    custom_domain: string | null;
    domain_verified: boolean;
    domain_verified_at: string | null;
  };
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
  // {
  //   provider: "non_shopify",
  //   title: "Non-Shopify Store",
  //   description: "WooCommerce, BigCommerce, custom, etc.",
  //   icon: "◎",
  // },
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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [shouldAutoSync, setShouldAutoSync] = useState(false);
  const [autoSyncTriggered, setAutoSyncTriggered] = useState(false);
  const [brandInfo, setBrandInfo] = useState<{
    id: string;
    full_name: string;
    custom_domain: string | null;
    domain_verified: boolean;
    domain_verified_at: string | null;
  } | null>(null);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [headlessStep, setHeadlessStep] = useState<
    "selection" | "shopify" | "pixel"
  >("selection");
  const [pixelStep, setPixelStep] = useState<
    "domain" |
    "confirmation" |
    "dns" |
    "install" |
    "verify"
  >("domain");
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [domainError, setDomainError] = useState("");
  const [showShopifySetupCard, setShowShopifySetupCard] = useState(false);
  const [showPixelConfirmation, setShowPixelConfirmation] =
    useState(false);
  const [showCustomPixelSetup, setShowCustomPixelSetup] = useState(false);
  const [customTrackingDomain, setCustomTrackingDomain] = useState("");
  const [showOrdersApiKey, setShowOrdersApiKey] = useState(false);
  const [authorizedDomainError, setAuthorizedDomainError] = useState("");
  const [isUpdatingDomain, setIsUpdatingDomain] = useState(false);
  const [isCreatingDomain, setIsCreatingDomain] =
    useState(false);
  const [isCheckingDns, setIsCheckingDns] =
    useState(false);
  const [isConfirmingPixel, setIsConfirmingPixel] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("autoSync") === "true") {
      setShouldAutoSync(true);
    }
  }, []);
  async function loadConnection(pageNumber = 1) {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/integrations/store?page=${pageNumber}&limit=10`,
        {
          cache: "no-store",
        }
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load integrations.");
      }

      setConnection(payload.connection);
      setProducts(payload.products);
      setBrandInfo(payload.brand ?? null);
      if (payload.pagination) {
        setPagination(payload.pagination);
        setPage(payload.pagination.page);
      }

      if (payload.connection) {
        setSelectedProvider(payload.connection.provider);
        setForm((current) => ({
          ...current,
          storeUrl: current.storeUrl || payload.connection?.store_url || "",
        }));
        if (
          payload.connection?.provider === "headless_shopify" &&
          payload.connection?.storefront_domain
        ) {
          const storefrontDomain =
            payload.connection.storefront_domain
              .trim()
              .toLowerCase();

          setPrimaryDomain(storefrontDomain);

          setCustomTrackingDomain(
            `analytics.${storefrontDomain}`
          );

          // setShowCustomPixelSetup(true);

          // setHeadlessStep("pixel");

          // setPixelStep("domain");
          // if (
          //   payload.connection?.provider === "headless_shopify" &&
          //   !payload.connection?.store_domain
          // ) {
          //   setShowShopifySetupCard(true);
          // } else {
          //   setShowShopifySetupCard(false);
          // }
          // if (payload.brand?.domain_verified) {
          //   setShowCustomPixelSetup(false);
          //   // setHeadlessStep("selection");
          // } else {
          //   setShowCustomPixelSetup(true);
          //   setHeadlessStep("pixel");
          //   setPixelStep("domain");
          // }
          setShowShopifySetupCard(false);
          if (payload.brand?.domain_verified) {
            setShowCustomPixelSetup(false);
          } else if (
            payload.connection?.provider === "headless_shopify"
          ) {
            setShowCustomPixelSetup(true);

            if (!payload.connection?.store_domain) {
              setHeadlessStep("shopify");
            } else {
              setHeadlessStep("pixel");
            }

            setPixelStep("domain");
          }

        }
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load integrations."
      );
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    void loadConnection(1);
  }, []);
  useEffect(() => {
    if (
      shouldAutoSync &&
      connection?.status === "connected" &&
      !autoSyncTriggered
    ) {
      setAutoSyncTriggered(true);

      setTimeout(() => {
        setIsSyncing(true);

        fetch("/api/integrations/store/sync", {
          method: "POST",
        })
          .then(() => {
            setTimeout(() => {
              loadConnection(1);
            }, 3000);
          })
          .catch((err) => console.error(err))
          .finally(() => {
            setIsSyncing(false);
            window.history.replaceState({}, "", "/dashboard/integrations");
          });
      }, 2000);
    }
  }, [shouldAutoSync, connection, autoSyncTriggered]);

  function validateDomain(domain: string) {
    const cleaned = domain.trim().toLowerCase();

    const domainRegex =
      /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

    return domainRegex.test(cleaned);
  }

  const normalizedPrimaryDomain = primaryDomain.trim().toLowerCase();
  const suggestedTrackingDomain = normalizedPrimaryDomain
    ? `analytics.${normalizedPrimaryDomain}`
    : "analytics.yourbrand.com";
  const alternateTrackingDomain = normalizedPrimaryDomain
    ? `track.${normalizedPrimaryDomain}`
    : "track.yourbrand.com";
  const activeTrackingDomain =
    customTrackingDomain.trim().toLowerCase() || suggestedTrackingDomain;
  const cnameRecordName = activeTrackingDomain.split(".")[0] || "analytics";
  const cnameRecordValue = "proxy.meetcircl.com";
  const ordersApiKey = connection?.id
    ? `${connection.id.replaceAll("-", "").slice(0, 24)}`
    : "sk_live_custom_pixel_key";
  const displayedOrdersApiKey = showOrdersApiKey
    ? ordersApiKey
    : ordersApiKey.replace(/.(?=.{4})/g, "*");
  async function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (selectedProvider === "shopify" || selectedProvider === "headless_shopify") {
        const res = await fetch("/api/shopify/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storeUrl: form.storeUrl,
            connectionType:
              selectedProvider === "headless_shopify"
                ? "headless_shopify"
                : "shopify",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Unable to connect store");
        }

        window.location.href = data.url;
        return;
      }

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
            selectedProvider === "non_shopify"
              ? form.storefrontAccessToken
              : null,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to connect your store.");
      }

      setConnection(payload.connection);
      setProducts(payload.products);
      setMessage(payload.message ?? "Store connected.");

    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to connect your store."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSync() {
    if (
      connection?.store_domain === "" ||
      connection?.store_domain === null
    ) {
      setSelectedProvider("headless_shopify");
      setHeadlessStep("shopify");
      setShowShopifySetupCard(true);
      return;
    }
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

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to disconnect store.");
      }

      setConnection(null);
      setProducts([]);
      setMessage(payload.message ?? "Store disconnected.");
      setForm(initialForm);
      setSelectedProvider("shopify");
      setShowCustomPixelSetup(false);
      setPrimaryDomain("");
      setCustomTrackingDomain("");
      setPixelStep("domain");
      setHeadlessStep("selection");
      // if (payload.uninstallUrl) {
      //   window.open(payload.uninstallUrl, "_blank");
      //   // window.location.href = "/dashboard/integrations";
      // }
      if (payload.uninstallUrl) {
        const newTab = window.open(payload.uninstallUrl, "_blank");

        if (newTab) {
          newTab.focus();
        }
      }

    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to disconnect store."
      );
    } finally {
      setIsDisconnecting(false);
    }
  }
  const isConnected = connection?.status === "connected";

  const completedSteps = [
    !!connection,
    products.length > 0,
    true, // pixel installed
    !!brandInfo?.domain_verified,
  ].filter(Boolean).length;
  const resetPixelFlow = () => {
    setPrimaryDomain("");
    setDomainError("");
    setShowPixelConfirmation(false);
  };
  // const handleBackToSelection = () => {
  //   resetPixelFlow();
  //   setHeadlessStep("selection");
  // };
  const handleBackToSelection = () => {
    resetPixelFlow();
    setShowShopifySetupCard(false);
    setHeadlessStep("selection");
  };
  const saveStorefrontDomain = async () => {
    const response = await fetch(
      "/api/integrations/store/storefront-domain",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storefrontDomain: primaryDomain.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    return data;
  };
  const createCustomTrackingDomain = async () => {
    if (!brandInfo?.id) {
      throw new Error("Brand not found");
    }

    const response = await fetch(
      "/api/brands/custom-domain",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId: brandInfo.id,
          customDomain: activeTrackingDomain.trim().toLowerCase(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to create custom domain"
      );
    }

    return data;
  };
  const checkDnsVerification = async () => {
    if (!brandInfo?.id) {
      throw new Error("Brand not found");
    }

    const response = await fetch(
      "/api/brands/check-domain",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId: brandInfo.id,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "DNS verification failed"
      );
    }

    return data;
  };
  const sanitizeDomain = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");
  const updateStorefrontDomain = async () => {
    const response = await fetch(
      "/api/integrations/store/storefront-domain",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storefrontDomain: primaryDomain.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to update domain."
      );
    }

    return data;
  };

  // const shouldShowShopifyForm =
  //   selectedProvider === "shopify"
  //     ? !isConnected
  //     : selectedProvider === "headless_shopify" &&
  //     (
  //       headlessStep === "shopify" ||
  //       showShopifySetupCard
  //     );

  const shouldShowShopifyForm =
    selectedProvider === "shopify"
      ? !isConnected
      : selectedProvider === "headless_shopify" &&
      headlessStep !== "pixel" &&
      (
        headlessStep === "shopify" ||
        showShopifySetupCard
      );
  return (
    <div className="space-y-6">
      {!showCustomPixelSetup ? (
        <>
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                E-commerce Store Connection
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-500">
                Connect your store to import products, track attribution, and keep
                campaign briefs tied to real catalog data. Tokens are stored
                server-side and never sent back to the browser.
              </p>
            </div>

            <div className="mt-10">
              <p className="text-[1.2rem] font-semibold text-slate-950">
                How is your e-commerce store set up?
              </p>
              {/* <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {providerCards.map((card) => { */}
              {/* <div className="mt-6 grid gap-4 xl:grid-cols-2"> */}
              <div
                className={cn(
                  "mt-6 grid gap-4",
                  isConnected ? "xl:grid-cols-2" : "xl:grid-cols-2 gap-x-8 gap-y-4"
                )}
              >
                {(isConnected
                  ? providerCards.filter(
                    (card) => card.provider === connection?.provider
                  )
                  : providerCards
                ).map((card) => {
                  const isActive = selectedProvider === card.provider;

                  return (
                    <div
                      key={card.provider}
                      // disabled={isConnected}
                      // type="button"
                      // onClick={() => setSelectedProvider(card.provider)}
                      onClick={() => {
                        setSelectedProvider(card.provider);

                        // if (card.provider === "headless_shopify") {
                        //   setHeadlessStep("selection");
                        // }
                      }}
                      className={cn(
                        "relative rounded-[1.75rem] border p-6 text-left transition",
                        isActive
                          ? "border-accent/30 bg-blue-50 shadow-[0_14px_30px_rgba(7,107,210,0.08)]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                        isConnected
                          ? "cursor-default disabled"
                          : " cursor-pointer",
                      )}
                    >
                      <div className="mt-2 sm:mt-1 flex items-start gap-4">
                        <span
                          className={cn(
                            "hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl text-2xl font-semibold",
                            card.provider === "shopify"
                              ? "bg-[#95bf47]/15 text-[#78a22f]"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {card.icon}
                        </span>
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            {card.title}
                          </p>
                          <p className="text-sm text-slate-500">
                            {card.description}
                          </p>
                        </div>
                      </div>
                      {isConnected && <div className="mt-3 flex flex-col gap-2">
                        <p className="text-sm ">
                          {connection?.store_url}
                        </p>
                        <div className="text-sm flex gap-2">
                          <p>{pagination?.total} products synced. </p>
                          <p>
                            last sync  {connection?.last_synced_at && formatDate(connection?.last_synced_at)}
                          </p>
                        </div>
                        {connection && (
                          <div className="flex gap-2 mt-2">
                            <MotionScale
                              type="button"
                              onClick={handleSync}
                              disabled={isSyncing}
                              className="sm:min-w-[110px] rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isSyncing ? "Syncing..." : "Sync products"}
                            </MotionScale>
                            <MotionScale
                              type="button"
                              onClick={handleDisconnect}
                              disabled={isDisconnecting}
                              className="sm:min-w-[110px] rounded-xl border border-rose-200 bg-rose-50 px-2 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                            </MotionScale>
                          </div>
                        )}
                      </div>}
                      {
                        isConnected &&
                        <span className="absolute top-2 right-4 bg-green-100 border rounded-full border-green-200 px-2 py-1 text-green-600 flex items-center">
                          <svg viewBox="0 0 48 48" width={15} height={15} fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <rect width="48" height="48" fill="white" fill-opacity="0.01"></rect> <path d="M24 33C28.9706 33 33 28.9706 33 24C33 19.0294 28.9706 15 24 15C19.0294 15 15 19.0294 15 24C15 28.9706 19.0294 33 24 33Z" fill="#16a34a" stroke="#16a34a" stroke-width="4"></path> </g></svg>
                          <span className="text-xs ">Connected</span>
                        </span>
                      }
                    </div>
                  );
                })}
                {isConnected && connection?.provider === "shopify" && !brandInfo?.domain_verified && (
                  <div className="relative rounded-[1.75rem] border border-amber-200 bg-[#fffbf0] p-6">
                    <div className="mt-1 flex items-start gap-2">
                      <span
                        className={cn(
                          "hidden sm:flex h-12 w-12 items-center justify-center border border-amber-200 rounded-2xl text-2xl font-semibold",
                          "bg-white text-slate-500",
                        )}
                      >
                        <svg
                          fill="#b45309"
                          viewBox="0 0 512 512"
                          xmlns="http://www.w3.org/2000/svg"
                          className="flex h-12 w-12 items-center justify-center font-semibold"
                        >
                          <g strokeWidth={0} />
                          <g strokeLinecap="round" strokeLinejoin="round" />
                          <title>{"ionicons-v5-a"}</title>
                          <path d="M456 128a40 40 0 0 0-37.23 54.6l-84.17 84.17a39.86 39.86 0 0 0-29.2 0l-60.17-60.17a40 40 0 1 0-74.46 0L70.6 306.77a40 40 0 1 0 22.63 22.63L193.4 229.23a39.86 39.86 0 0 0 29.2 0l60.17 60.17a40 40 0 1 0 74.46 0l84.17-84.17A40 40 0 1 0 456 128" />
                        </svg>
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          Attribution Tracking
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                          Pixel + custom domain
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-slate-700">
                        Pixel installed but custom domain not verified.
                      </p>

                      <p className="mt-2 text-sm text-amber-700">
                        Without it, 30–40% of conversions are lost from ad blockers.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDomainModal(true)}
                      className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    >
                      Finish setup →
                    </button>
                    <span className=" absolute top-1 right-3 border rounded-full border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 flex items-center gap-1">
                      <svg
                        fill="#b45309"
                        viewBox="0 0 64 64"
                        width={16}
                        height={16}
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                        xmlSpace="preserve"
                        style={{
                          fillRule: "evenodd",
                          clipRule: "evenodd",
                          strokeLinejoin: "round",
                          strokeMiterlimit: 2,
                        }}
                      >
                        <g id="SVGRepo_bgCarrier" strokeWidth={0} />
                        <g
                          id="SVGRepo_tracerCarrier"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <g id="SVGRepo_iconCarrier">
                          <rect
                            id="Icons"
                            x={-640}
                            y={-64}
                            width={1280}
                            height={800}
                            style={{
                              fill: "none",
                            }}
                          />
                          <g id="Icons1">
                            <g id="Strike" />
                            <g id="H1" />
                            <g id="H2" />
                            <g id="H3" />
                            <g id="list-ul" />
                            <g id="hamburger-1" />
                            <g id="hamburger-2" />
                            <g id="list-ol" />
                            <g id="list-task" />
                            <g id="trash" />
                            <g id="vertical-menu" />
                            <g id="horizontal-menu" />
                            <g id="sidebar-2" />
                            <g id="Pen" />
                            <g id="Pen1" />
                            <g id="clock" />
                            <g id="external-link" />
                            <g id="hr" />
                            <g id="info" />
                            <g id="warning">
                              <path
                                d="M32.427,7.987c2.183,0.124 4,1.165 5.096,3.281l17.936,36.208c1.739,3.66 -0.954,8.585 -5.373,8.656l-36.119,0c-4.022,-0.064 -7.322,-4.631 -5.352,-8.696l18.271,-36.207c0.342,-0.65 0.498,-0.838 0.793,-1.179c1.186,-1.375 2.483,-2.111 4.748,-2.063Zm-0.295,3.997c-0.687,0.034 -1.316,0.419 -1.659,1.017c-6.312,11.979 -12.397,24.081 -18.301,36.267c-0.546,1.225 0.391,2.797 1.762,2.863c12.06,0.195 24.125,0.195 36.185,0c1.325,-0.064 2.321,-1.584 1.769,-2.85c-5.793,-12.184 -11.765,-24.286 -17.966,-36.267c-0.366,-0.651 -0.903,-1.042 -1.79,-1.03Z"
                                style={{
                                  fillRule: "nonzero",
                                }}
                              />
                              <path
                                d="M33.631,40.581l-3.348,0l-0.368,-16.449l4.1,0l-0.384,16.449Zm-3.828,5.03c0,-0.609 0.197,-1.113 0.592,-1.514c0.396,-0.4 0.935,-0.601 1.618,-0.601c0.684,0 1.223,0.201 1.618,0.601c0.395,0.401 0.593,0.905 0.593,1.514c0,0.587 -0.193,1.078 -0.577,1.473c-0.385,0.395 -0.929,0.593 -1.634,0.593c-0.705,0 -1.249,-0.198 -1.634,-0.593c-0.384,-0.395 -0.576,-0.886 -0.576,-1.473Z"
                                style={{
                                  fillRule: "nonzero",
                                }}
                              />
                            </g>
                            <g id="plus-circle" />
                            <g id="minus-circle" />
                            <g id="vue" />
                            <g id="cog" />
                            <g id="logo" />
                            <g id="radio-check" />
                            <g id="eye-slash" />
                            <g id="eye" />
                            <g id="toggle-off" />
                            <g id="shredder" />
                            <g id="spinner--loading--dots-" />
                            <g id="react" />
                            <g id="check-selected" />
                            <g id="turn-off" />
                            <g id="code-block" />
                            <g id="user" />
                            <g id="coffee-bean" />
                            <g id="coffee-beans">
                              <g id="coffee-bean1" />
                            </g>
                            <g id="coffee-bean-filled" />
                            <g id="coffee-beans-filled">
                              <g id="coffee-bean2" />
                            </g>
                            <g id="clipboard" />
                            <g id="clipboard-paste" />
                            <g id="clipboard-copy" />
                            <g id="Layer1" />
                          </g>
                        </g>
                      </svg>
                      <span>Action needed</span>
                    </span>
                  </div>
                )}
                {/* {isConnected &&
                  connection?.provider === "headless_shopify" &&
                  !brandInfo?.domain_verified && (
                    <div className="relative rounded-[1.75rem] border border-blue-200 bg-blue-50 p-6">
                      <h3>Universal Pixel Setup</h3>

                      <p>
                        Complete pixel and custom domain setup for frontend tracking.
                      </p>

                      <button
                        onClick={() => {
                          setShowCustomPixelSetup(false); // important
                          setHeadlessStep("pixel");
                          setShowPixelConfirmation(false);
                          setPixelStep("domain");
                        }}
                      >
                        Setup Pixel →
                      </button>
                    </div>
                  )} */}
                {isConnected &&
                  connection?.provider === "headless_shopify" &&
                  !brandInfo?.domain_verified && (
                    <div className="relative rounded-[1.75rem] border border-blue-200 bg-[#f5f9ff] p-6">

                      <div className="mt-2 sm:mt-1 grid grid-cols-[auto_1fr] items-start gap-4">
                        <span className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-white">
                          <svg
                            className="h-6 w-6 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9.75 17L4 12.25 5.5 10.75 9.75 14.25 18.5 5.5 20 7z"
                            />
                          </svg>
                        </span>

                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            Universal Pixel Setup
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            Complete pixel installation and custom domain setup for
                            frontend attribution tracking.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm text-slate-700">
                          Frontend tracking is not fully configured yet.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomPixelSetup(false);
                          setHeadlessStep("pixel");
                          setShowPixelConfirmation(false);
                          setPixelStep("domain");
                        }}
                        className="mt-5 rounded-xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_20px_rgba(7,107,210,0.25)]"
                      >
                        Finish Setup →
                      </button>

                      {/* <span className="absolute top-2 right-3 rounded-full border border-blue-200 bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                        {brandInfo?.domain_verified ? "Completed" :  "Setup Required"}
                      </span> */}
                      <span
                        className={cn(
                          "absolute top-2 right-3 rounded-full px-2 py-1 text-xs font-semibold flex items-center",
                          brandInfo?.domain_verified
                            ? "bg-green-100 border border-green-200 text-green-600"
                            : "bg-blue-100 border border-blue-200 text-blue-700"
                        )}
                      >
                        {brandInfo?.domain_verified && <svg viewBox="0 0 48 48" width={15} height={15} fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <rect width="48" height="48" fill="white" fill-opacity="0.01"></rect> <path d="M24 33C28.9706 33 33 28.9706 33 24C33 19.0294 28.9706 15 24 15C19.0294 15 15 19.0294 15 24C15 28.9706 19.0294 33 24 33Z" fill="#16a34a" stroke="#16a34a" stroke-width="4"></path> </g></svg>}
                        <span>{brandInfo?.domain_verified ? "Completed" : "Setup Required"}</span>
                      </span>
                    </div>
                  )}
              </div>

            </div>
            {!isConnected &&
              selectedProvider === "headless_shopify" &&
              headlessStep === "selection" && (
                <div className="mt-8">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm text-blue-600">
                      Headless setups require both Shopify (for orders/products)
                      and the Universal Pixel (for frontend tracking).
                    </p>
                  </div>

                  <p className="mt-6 text-lg font-medium">
                    Choose which to set up first:
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setHeadlessStep("shopify")}
                      className="rounded-2xl border border-slate-200 p-6 text-left hover:border-blue-300"
                    >
                      <h3 className="font-semibold">
                        Shopify Connection
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        For product catalog and order data
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHeadlessStep("pixel")}
                      className="relative rounded-2xl border border-slate-200 p-6 text-left hover:border-blue-300"
                    >
                      <h3 className="font-semibold">
                        Universal Pixel
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        For frontend tracking on your custom site
                      </p>
                      {selectedProvider === "headless_shopify" &&
                        brandInfo?.domain_verified && <span className="absolute top-2 right-4 bg-green-100 border rounded-full border-green-200 px-2 py-1 text-green-600 text-xs flex items-center">
                          <svg viewBox="0 0 48 48" width="15" height="15" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <rect width="48" height="48" fill="white" fill-opacity="0.01"></rect> <path d="M24 33C28.9706 33 33 28.9706 33 24C33 19.0294 28.9706 15 24 15C19.0294 15 15 19.0294 15 24C15 28.9706 19.0294 33 24 33Z" fill="#16a34a" stroke="#16a34a" stroke-width="4"></path> </g></svg>
                          <span>Completed</span>
                        </span>}
                    </button>
                  </div>
                </div>
              )}
            {
              selectedProvider === "headless_shopify" &&
              headlessStep === "pixel" && !brandInfo?.domain_verified && (
                <div className="mt-8">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                      <div className="flex gap-3">
                        <div className="mt-1">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="#3b82f6"
                              strokeWidth="2"
                            />
                            <path
                              d="M12 8V12"
                              stroke="#3b82f6"
                              strokeWidth="2"
                            />
                            <circle
                              cx="12"
                              cy="16"
                              r="1"
                              fill="#3b82f6"
                            />
                          </svg>
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-900">
                            Universal Pixel with Ad Blocker Bypass
                          </h3>

                          <p className="mt-2 text-sm text-slate-600">
                            Creates a ready-to-use embed snippet for tracking
                            video performance with custom domain support to
                            bypass ad blockers.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h4 className="font-semibold text-slate-900">
                        Step 1: Primary Domain
                      </h4>

                      <p className="mt-2 text-sm text-slate-500">
                        Enter your storefront&apos;s primary domain. Subdomains (e.g. *.domain.com) are automatically included.
                      </p>

                      <div className="mt-5">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <input
                              value={primaryDomain}
                              onChange={(e) => {
                                const value = e.target.value
                                  .replace(/^https?:\/\//, "")
                                  .replace(/\/$/, "");

                                setPrimaryDomain(value);

                                if (domainError) {
                                  setDomainError("");
                                }
                              }}
                              placeholder="example.com"
                              className={cn(
                                "h-12 w-full rounded-2xl border bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]",
                                domainError
                                  ? "border-red-400 focus:border-red-400 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.15)]"
                                  : "border-slate-200"
                              )}
                            />

                            {domainError && (
                              <p className="mt-2 text-sm text-red-500">
                                {domainError}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const domain = primaryDomain.trim();

                              if (!domain) {
                                setDomainError("Primary domain is required");
                                return;
                              }

                              if (!validateDomain(domain)) {
                                setDomainError(
                                  "Enter a valid domain (example.com)"
                                );
                                return;
                              }

                              setDomainError("");

                              setShowPixelConfirmation(true);
                            }}
                            className="h-12 shrink-0 rounded-2xl bg-blue-500 px-8 font-medium text-white hover:bg-blue-600"
                          >
                            Continue
                          </button>
                        </div>
                      </div>
                    </div>

                    {!isConnected && <button
                      type="button"
                      // onClick={() => setHeadlessStep("selection")}
                      onClick={handleBackToSelection}
                      className="mt-8 text-sm text-slate-500"
                    >
                      ← Back to type selection
                    </button>}
                  </div>
                </div>
              )}
            {shouldShowShopifyForm && <form className="mt-8 space-y-5" onSubmit={handleConnect}>
              {/* {selectedProvider === "headless_shopify" &&
                headlessStep !== "selection" && (
                  <button
                    type="button"
                    onClick={() => setHeadlessStep("selection")}
                    className="text-sm text-slate-500"
                  >
                    ← Back to type selection
                  </button>
                )} */}
              {selectedProvider === "headless_shopify" &&
                headlessStep !== "selection" &&
                !showShopifySetupCard && (
                  <button
                    type="button"
                    onClick={() => setHeadlessStep("selection")}
                    className="text-sm text-slate-500"
                  >
                    ← Back to type selection
                  </button>
                )}
              <div className="grid gap-5 md:grid-cols-2">
                {<div>
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
                </div>}
                {/* <div>
              <label
                htmlFor="integration-access-token"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                {getTokenLabel(selectedProvider)}
              </label>
              <input
                id="integration-access-token"
                type="password"
                // required
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
            </div> */}
              </div>

              {/* {selectedProvider === "headless_shopify" ? (
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
                ) : null} */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-slate-500">
                  {!connection &&
                    <p>
                      Connect once, then sync products on demand without re-entering
                      the token.
                    </p>
                  }
                </div>
                <div className="flex flex-wrap gap-3">
                  {/* {connection ? (
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
              ) : null} */}
                  {<MotionScale
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Connecting..." : "Connect Store"}
                  </MotionScale>}
                </div>
              </div>

              {message ? <p className="text-sm text-slate-500">{message}</p> : null}
            </form>}
          </section>
          {isConnected &&
            connection?.provider === "shopify" && (
              <div className="mt-6 rounded-[1.75rem] border border-blue-100 bg-white p-6 shadow-[0_12px_32px_rgba(7,107,210,0.08)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Custom Domain Setup
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Improve attribution accuracy and reduce ad blocker impact.
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {completedSteps} of 4 complete
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <span className="text-slate-700">Store connected</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className={
                        products.length
                          ? "text-green-600"
                          : "text-amber-500"
                      }> {products.length ? "✓" : "○"}</span>
                      <span className="text-slate-700">Products synced</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600">✓</span>
                      <span className="text-slate-700">Pixel installed</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={
                          brandInfo?.domain_verified
                            ? "text-green-600"
                            : "text-amber-500"
                        }
                      >
                        {brandInfo?.domain_verified ? "✓" : "○"}
                      </span>

                      <span
                        className={
                          brandInfo?.domain_verified
                            ? "text-slate-700"
                            : "text-amber-700 font-medium"
                        }
                      >
                        {brandInfo?.domain_verified
                          ? "Custom domain verified"
                          : "Custom domain not verified"}
                      </span>
                    </div>
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {connection?.store_url}
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      {products.length} products synced
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Tracking active
                    </p>

                    {!brandInfo?.domain_verified && (
                      // <button
                      //   type="button"
                      //   className="mt-4 rounded-xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_20px_rgba(7,107,210,0.25)]"
                      // >
                      //   Complete Setup →
                      // </button>
                      <button
                        type="button"
                        onClick={() => setShowDomainModal(true)}
                        className="mt-4 rounded-xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-4 py-2 text-sm font-medium text-white"
                      >
                        Complete Setup →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-[1.2rem] font-semibold tracking-tight text-slate-950">
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
              <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                <div className="overflow-x-auto">
                  <div className="min-w-[860px]">
                    <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr_0.9fr] gap-5 border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                      {["Product", "Vendor", "Type", "Price", "Status"].map(
                        (heading) => (
                          <div
                            key={heading}
                            className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
                          >
                            {heading}
                          </div>
                        ),
                      )}
                    </div>

                    <div className="divide-y divide-slate-100">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={index}
                          className="grid animate-pulse grid-cols-[2fr_1fr_1fr_0.8fr_0.9fr] items-center gap-5 px-5 py-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-slate-100" />
                            <div className="min-w-0 space-y-2">
                              <div className="h-4 w-48 rounded-full bg-slate-100" />
                              <div className="h-3 w-28 rounded-full bg-slate-100" />
                            </div>
                          </div>
                          <div className="h-4 w-24 rounded-full bg-slate-100" />
                          <div className="h-7 w-28 rounded-full bg-slate-100" />
                          <div className="h-4 w-16 rounded-full bg-slate-100" />
                          <div className="h-7 w-24 rounded-full bg-slate-100" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : products.length ? (
              // <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              //   {products.map((product) => (
              //     <div
              //       key={product.id}
              //       className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white"
              //     >
              //       <div className="aspect-[1.5/1] bg-slate-100">
              //         {product.image_url ? (
              //           // eslint-disable-next-line @next/next/no-img-element
              //           <img
              //             src={product.image_url}
              //             alt={product.title}
              //             className="h-full w-full object-cover"
              //           />
              //         ) : (
              //           <div className="flex h-full items-center justify-center text-sm text-slate-400">
              //             No image
              //           </div>
              //         )}
              //       </div>
              //       <div className="space-y-3 p-5">
              //         <div className="flex items-start justify-between gap-3">
              //           <div>
              //             <p className="font-semibold text-slate-950">
              //               {product.title}
              //             </p>
              //             <p className="mt-1 text-sm text-slate-500">
              //               {product.vendor ?? "Unknown vendor"}
              //             </p>
              //           </div>
              //           <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              //             {product.status ?? "synced"}
              //           </span>
              //         </div>
              //         <div className="text-sm text-slate-500">
              //           <p>{product.product_type ?? "Uncategorized"}</p>
              //           <p className="mt-1">
              //             {product.price !== null
              //               ? formatCurrency(product.price)
              //               : "Price unavailable"}
              //           </p>
              //         </div>
              //       </div>
              //     </div>
              //   ))}
              // </div>
              <div className="mt-8">
                <ProductTable products={products as any} />

                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onChange={(p) => loadConnection(p)}
                />
              </div>
            ) : (
              <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                {connection
                  ? "No products have been synced yet. Run a sync or reconnect with a token that can read products."
                  : "Connect your store to import products into CIRCL."}
              </div>
            )}
          </section>

          <BrandStoreAnalyticsPanel connection={connection} />
        </>
      ) : (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              E-commerce Store Connection
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Connect your store to start attribution tracking and see which
              videos and creators are driving sales for your brand.
            </p>
          </div>

          {pixelStep === "dns" ? (
            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" strokeWidth="2" />
                    <path
                      d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.4 3.2 5.4 3.2 9S14.2 18.6 12 21M12 3C9.8 5.4 8.8 8.4 8.8 12s1 6.6 3.2 9"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    Step 2: Add CNAME Record to Your DNS
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Add the following CNAME record in your DNS provider
                    (GoDaddy, Cloudflare, etc.)
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">
                    CNAME Record Details
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(
                        `Type: CNAME\nName: ${cnameRecordName}\nValue: ${cnameRecordValue}\nTTL: 3600`
                      );
                      setMessage("CNAME details copied.");
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 8h10v10H8zM6 14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"
                      />
                    </svg>
                    Copy
                  </button>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-slate-700">
                  {[
                    ["Type", "CNAME"],
                    ["Name", cnameRecordName],
                    ["Value", cnameRecordValue],
                    ["TTL", "3600"],
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[70px_1fr] items-center gap-3">
                      <span>{label}:</span>
                      <span className="w-fit rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-950">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800">
                <p className="font-semibold">Instructions:</p>
                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  <li>Log in to your DNS provider (GoDaddy, Cloudflare, etc.)</li>
                  <li>Navigate to DNS Management for your domain</li>
                  <li>Click &quot;Add Record&quot; or &quot;Add DNS Record&quot;</li>
                  <li>Select &quot;CNAME&quot; as the record type</li>
                  <li>
                    Enter the Name:{" "}
                    <span className="rounded-md bg-white px-2 py-1 font-mono text-blue-700">
                      {cnameRecordName}
                    </span>{" "}
                    (or @ if using apex domain)
                  </li>
                  <li>
                    Enter the Value:{" "}
                    <span className="rounded-md bg-white px-2 py-1 font-mono text-blue-700">
                      {cnameRecordValue}
                    </span>
                  </li>
                  <li>Set TTL to 3600 seconds (or leave as default)</li>
                  <li>Save the record</li>
                  <li>Wait 1-2 minutes for DNS propagation, then click &quot;Check DNS&quot; below</li>
                </ol>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPixelStep("domain")}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isCheckingDns}
                  onClick={async () => {
                    try {
                      setIsCheckingDns(true);

                      const data =
                        await checkDnsVerification();

                      // if (data.verified) {
                      //   toast.success(
                      //     "Custom domain verified successfully!"
                      //   );

                      //   await loadConnection();

                      //   setPixelStep("install");
                      // } else {
                      //   toast.info(
                      //     "DNS record not detected yet. Please wait for propagation and try again."
                      //   );
                      // }
                      if (data.verified) {
                        toast.success(
                          "Custom domain verified successfully!"
                        );

                        await loadConnection();

                        // setPixelStep("install");
                        setHeadlessStep("pixel");
                        return;
                      }

                      if (data.dnsErrorType === "INVALID_TARGET") {
                        toast.error(
                          data.verificationMessage ||
                          "CNAME points to the wrong target."
                        );
                        return;
                      }

                      if (data.dnsErrorType === "NOT_FOUND") {
                        toast.error(
                          "Domain not found or no CNAME record configured."
                        );
                        return;
                      }
                      if (data.sslStatus === "pending_validation") {
                        toast.info(
                          "DNS configured successfully. Waiting for SSL validation to complete. Please check again in a few minutes."
                        );
                        return;
                      }
                      toast.info(
                        "DNS can take 1-60 minutes to propagate. Please try again."
                      );
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "DNS verification failed"
                      );
                    } finally {
                      setIsCheckingDns(false);
                    }
                  }}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {isCheckingDns
                    ? "Checking..."
                    : "Check DNS"}
                </button>
              </div>

              <p className="mt-6 text-xs leading-6 text-slate-500">
                <span className="font-semibold text-slate-700">
                  Troubleshooting:
                </span>{" "}
                If verification fails, double-check the CNAME record in your DNS
                provider. Make sure the Name field matches exactly and there are
                no typos in the Value field.
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" strokeWidth="2" />
                    <path
                      d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.4 3.2 5.4 3.2 9S14.2 18.6 12 21M12 3C9.8 5.4 8.8 8.4 8.8 12s1 6.6 3.2 9"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    Step 2: Custom Domain Setup (Required)
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Setting up a custom domain ensures maximum tracking accuracy
                    by bypassing ad blockers. This is required for optimal
                    attribution performance.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex gap-3 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-400 text-xs font-semibold text-slate-600">
                    i
                  </span>
                  <p className="leading-6">
                    <span className="font-semibold text-slate-950">
                      Why is this required?
                    </span>{" "}
                    Ad blockers block tracking from third-party domains, causing
                    30-40% data loss. A custom domain on your own site bypasses
                    these blockers, improving tracking accuracy to 95%+.
                  </p>
                </div>
              </div>

              <div className="mt-6 max-w-xl">
                <label className="block text-sm font-semibold text-slate-900">
                  Custom Tracking Domain
                </label>
                <input
                  value={customTrackingDomain || suggestedTrackingDomain}
                  onChange={(event) => {
                    setCustomTrackingDomain(event.target.value);
                    setDomainError("");
                  }}
                  placeholder={suggestedTrackingDomain}
                  className={cn(
                    "mt-3 h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]",
                    domainError ? "border-rose-300" : "border-slate-200"
                  )}
                />
                {domainError ? (
                  <p className="mt-2 text-sm text-rose-600">{domainError}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                  <span>Suggestion: Use a subdomain like</span>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomTrackingDomain(alternateTrackingDomain)
                    }
                    className="rounded-md bg-blue-50 px-2 py-1 font-mono text-blue-700 transition hover:bg-blue-100"
                  >
                    {alternateTrackingDomain}
                  </button>
                  <span>or</span>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomTrackingDomain(suggestedTrackingDomain)
                    }
                    className="rounded-md bg-blue-50 px-2 py-1 font-mono text-blue-700 transition hover:bg-blue-100"
                  >
                    {suggestedTrackingDomain}
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800">
                <p className="font-semibold">What happens next:</p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5">
                  <li>You&apos;ll receive CNAME instructions for your DNS provider</li>
                  <li>Add the CNAME record</li>
                  <li>Click Check DNS to verify configuration</li>
                  <li>Once verified, your pixel embed code will be ready</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const domain = activeTrackingDomain.trim().toLowerCase();

                  if (!validateDomain(domain)) {
                    setDomainError(
                      "Please enter a valid tracking domain like analytics.brand.com"
                    );
                    return;
                  }

                  try {
                    setIsCreatingDomain(true);
                    setDomainError("");

                    const result =
                      await createCustomTrackingDomain();

                    await loadConnection();

                    setMessage(
                      "Custom tracking domain created successfully."
                    );

                    setPixelStep("dns");
                  } catch (error) {
                    setDomainError(
                      error instanceof Error
                        ? error.message
                        : "Unable to create custom domain"
                    );
                  } finally {
                    setIsCreatingDomain(false);
                  }
                }}
                className="mt-5 rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.22)] transition hover:opacity-95"
              >
                {isCreatingDomain
                  ? "Creating Domain..."
                  : "Continue to DNS Setup"}
              </button>
            </div>
          )}

          <div className="mt-6 border-t border-slate-200 pt-6">
            {/* <div>
              <label className="block text-sm font-semibold text-slate-900">
                Orders API Key
              </label>
              <p className="mt-1 text-sm text-slate-500">
                Use this private key for server-side order submissions. Keep it
                secret and never expose it in client-side code.
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center rounded-xl border border-slate-200 bg-white shadow-sm">
                  <input
                    readOnly
                    value={displayedOrdersApiKey}
                    className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOrdersApiKey((current) => !current)}
                    className="px-4 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    {showOrdersApiKey ? "Hide" : "Show"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(ordersApiKey);
                    setMessage("Orders API key copied.");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  Rotate Key
                </button>
              </div>
            </div> */}

            <div>
              <label className="block text-sm font-semibold text-slate-900">
                Authorized domain
              </label>
              <p className="mt-1 text-sm text-slate-500">
                We automatically include your root domain and a wildcard for all
                subdomains. Update this if you entered the wrong site.
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  value={primaryDomain}
                  onChange={(event) => {
                    const value = sanitizeDomain(event.target.value);

                    setPrimaryDomain(value);

                    if (authorizedDomainError) {
                      setAuthorizedDomainError("");
                    }
                  }}
                  className={cn(
                    "h-12 min-w-0 flex-1 rounded-xl border bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition",
                    authorizedDomainError
                      ? "border-red-400"
                      : "border-slate-200"
                  )}
                />
                {authorizedDomainError && (
                  <p className="mt-2 text-sm text-red-500">
                    {authorizedDomainError}
                  </p>
                )}
                <button
                  type="button"
                  // onClick={() => {
                  //   setCustomTrackingDomain(`analytics.${primaryDomain}`);
                  //   setMessage("Authorized domain updated.");
                  // }}
                  onClick={async () => {
                    const domain = sanitizeDomain(primaryDomain);

                    if (!domain) {
                      setAuthorizedDomainError(
                        "Authorized domain is required"
                      );
                      return;
                    }

                    if (!validateDomain(domain)) {
                      setAuthorizedDomainError(
                        "Enter a valid domain (example.com)"
                      );
                      return;
                    }

                    try {
                      setIsUpdatingDomain(true);
                      setAuthorizedDomainError("");

                      await updateStorefrontDomain();

                      setPrimaryDomain(domain);

                      setCustomTrackingDomain(
                        `analytics.${domain}`
                      );

                      await loadConnection();

                      setMessage("Authorized domain updated.");
                    } catch (error) {
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : "Unable to update domain."
                      );
                    } finally {
                      setIsUpdatingDomain(false);
                    }
                  }}
                  className="rounded-xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.18)] transition hover:opacity-95"
                >
                  Update Domain
                </button>
              </div>

              {/* <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Allowed domains
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {normalizedPrimaryDomain || "yourbrand.com"}
                  </span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    *.{normalizedPrimaryDomain || "yourbrand.com"}
                  </span>
                </div>
              </div> */}
            </div>
          </div>
        </section>
      )}
      <CustomDomainSetupModal
        open={showDomainModal}
        onClose={() => setShowDomainModal(false)}
        onVerified={async () => {
          await loadConnection(page);
        }}
        storeUrl={connection?.store_url ?? ""}
        brandId={brandInfo?.id ?? ""}
      />
      <ConfirmationModal
        open={showPixelConfirmation}
        title="Are you sure?"
        description="Custom pixel setup is only needed for brands using a headless Shopify storefront or a non-Shopify platform. Our Shopify app automatically installs tracking for standard Shopify stores."
        confirmText="Yes, I am sure"
        cancelText="Cancel"
        onClose={() => setShowPixelConfirmation(false)}
        onConfirm={async () => {
          try {
            setIsConfirmingPixel(true);
            await saveStorefrontDomain();

            setShowPixelConfirmation(false);
            setShowCustomPixelSetup(true);
            setCustomTrackingDomain(suggestedTrackingDomain);

            await loadConnection();
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Unable to save storefront domain."
            );
          } finally {
            setIsConfirmingPixel(false);
          }
        }}
      />
      <BrandMetaPanel mode="integrations" />
    </div>
  );
}