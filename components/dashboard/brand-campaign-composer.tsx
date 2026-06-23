"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  BrandCampaignSummary,
  BrandStoreProduct,
  CampaignStatus,
} from "@/lib/types";

type BrandCampaignComposerProps = {
  brandId: string;
  campaign?: BrandCampaignSummary | null;
  onCancel?: () => void;
  onSaved?: () => void;
  cancelHref?: string;
  cancelLabel?: string;
  redirectTo?: string;
};

type IntegrationResponse = {
  products?: BrandStoreProduct[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
};

const PRODUCT_PAGE_SIZE = 20;

const initialForm = {
  title: "",
  productName: "",
  productDetails: "",
  contentType: "UGC Video",
  budget: "",
  platforms: "",
  description: "",
  deliverables: "",
  creatorSlots: "3",
  duration: "14 days",
  deadline: "",
  paymentType: "Fixed",
  status: "open" as CampaignStatus,
  usageRights: "",
  creatorRequirements: "",
};

function buildCampaignForm(campaign?: BrandCampaignSummary | null) {
  if (!campaign) {
    return initialForm;
  }

  return {
    title: campaign.title,
    productName: campaign.product_name,
    productDetails: campaign.product_details,
    contentType: campaign.content_type,
    budget: String(campaign.budget || ""),
    platforms: campaign.platforms.join(", "),
    description: campaign.description,
    deliverables: campaign.deliverables,
    creatorSlots: String(campaign.creator_slots || 1),
    duration: campaign.duration,
    deadline: campaign.deadline ? campaign.deadline.slice(0, 10) : "",
    paymentType: campaign.payment_type,
    status: campaign.status,
    usageRights: campaign.usage_rights,
    creatorRequirements: campaign.creator_requirements,
  };
}

function buildProductDetailsSuggestion(product: BrandStoreProduct) {
  return [
    product.vendor,
    product.product_type,
    product.price !== null
      ? `${product.currency ?? "USD"} ${product.price}`
      : null,
  ]
    .filter(Boolean)
    .join(" - ");
}

function buildCombinedProductName(products: BrandStoreProduct[]) {
  return products.map((product) => product.title).join(", ");
}

function normalizeProductTokens(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function BrandCampaignComposer({
  brandId,
  campaign = null,
  onCancel,
  onSaved,
  cancelHref,
  cancelLabel,
  redirectTo,
}: BrandCampaignComposerProps) {
  const router = useRouter();
  const [form, setForm] = useState(() => buildCampaignForm(campaign));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [storeProducts, setStoreProducts] = useState<BrandStoreProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<BrandStoreProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(campaign);
  const productListRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const latestSearchRef = useRef("");
  const selectedProductIds = new Set(
    selectedProducts.map((product) => product.id),
  );

  // useEffect(() => {
  //   setForm(buildCampaignForm(campaign));
  //   setFeedback(null);
  // }, [campaign]);

  useEffect(() => {

    setForm(
      buildCampaignForm(
        campaign
      )
    );

    setFeedback(
      null
    );

    setStep(
      1
    );

  }, [campaign]);

  // useEffect(() => {
  //   const selectedTitles = new Set(normalizeProductTokens(form.productName));

  //   setSelectedProducts((current) => {
  //     const currentMap = new Map(current.map((product) => [product.id, product]));
  //     const matchingProducts = storeProducts.filter((product) =>
  //       selectedTitles.has(product.title),
  //     );
  //     const nextProducts = [...current];

  //     for (const product of matchingProducts) {
  //       if (!currentMap.has(product.id)) {
  //         nextProducts.push(product);
  //       }
  //     }

  //     return nextProducts.filter((product) => selectedTitles.has(product.title));
  //   });
  // }, [storeProducts, form.productName]);

  useEffect(() => {
    if (!campaign?.id) return;

    const supabase = createClient();

    async function loadSelectedProducts() {
      const { data } = await supabase
        .from("campaign_products")
        .select("product_id")
        .eq("campaign_id", campaign?.id);

      if (!data) return;

      const ids = data.map((item) => item.product_id);
      const { data: products } = await supabase
        .from("brand_store_products")
        .select("*")
        .in("id", ids);

      if (products) {
        setSelectedProducts(products);
      }
    }

    loadSelectedProducts();
  }, [campaign?.id]);

  async function loadStoreProducts({
    page,
    search,
    reset,
  }: {
    page: number;
    search: string;
    reset: boolean;
  }) {
    const trimmedSearch = search.trim();

    if (reset) {
      setIsLoadingProducts(true);
    } else {
      setIsLoadingMoreProducts(true);
    }

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PRODUCT_PAGE_SIZE),
        status: "active",
      });

      if (trimmedSearch) {
        params.set("search", trimmedSearch);
      }

      const response = await fetch(`/api/integrations/store?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as IntegrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load store products.");
      }

      const nextProducts = payload.products ?? [];
      const totalPages = payload.pagination?.totalPages ?? 1;

      latestSearchRef.current = trimmedSearch;
      setStoreProducts((current) => {
        if (reset) {
          return nextProducts;
        }

        const seen = new Set(current.map((product) => product.id));
        return [
          ...current,
          ...nextProducts.filter((product) => !seen.has(product.id)),
        ];
      });
      setProductPage(page);
      setHasMoreProducts(page < totalPages);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to load store products.",
      );

      if (reset) {
        setStoreProducts([]);
      }

      setHasMoreProducts(false);
    } finally {
      setIsLoadingProducts(false);
      setIsLoadingMoreProducts(false);
    }
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadStoreProducts({
        page: 1,
        search: productSearch,
        reset: true,
      });
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [productSearch]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasMoreProducts) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (
          entry?.isIntersecting &&
          !isLoadingProducts &&
          !isLoadingMoreProducts &&
          hasMoreProducts
        ) {
          void loadStoreProducts({
            page: productPage + 1,
            search: latestSearchRef.current,
            reset: false,
          });
        }
      },
      {
        root: productListRef.current,
        threshold: 0.2,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMoreProducts, isLoadingMoreProducts, isLoadingProducts, productPage]);

  function handleToggleProduct(product: BrandStoreProduct) {
    const isSelected = selectedProductIds.has(product.id);

    setSelectedProducts((current) => {
      const nextProducts = isSelected
        ? current.filter((item) => item.id !== product.id)
        : [...current, product];

      setForm((currentForm) => ({
        ...currentForm,
        productName:
          nextProducts.length > 0
            ? buildCombinedProductName(nextProducts)
            : currentForm.productName
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item && item !== product.title)
              .join(", "),
        productDetails: currentForm.productDetails,
      }));

      return nextProducts;
    });
  }
  function canProceedToStep2() {
    return (
      form.title &&
      form.contentType &&
      form.budget &&
      form.platforms &&
      form.creatorSlots
    );
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const supabase = createClient();
    const payload = {
      brand_id: brandId,
      title: form.title,
      product_name: form.productName,
      product_details: form.productDetails,
      content_type: form.contentType,
      budget: Number(form.budget),
      description: form.description,
      platforms: form.platforms
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      creator_slots: Math.max(1, Number(form.creatorSlots) || 1),
      deliverables: form.deliverables,
      duration: form.duration,
      deadline: form.deadline || null,
      payment_type: form.paymentType,
      status: form.status,
      usage_rights: form.usageRights,
      creator_requirements: form.creatorRequirements,
    };
    const query = isEditing
      ? supabase
        .from("campaigns")
        .update(payload)
        .eq("id", campaign?.id ?? "")
        .eq("brand_id", brandId)
      : supabase.from("campaigns").insert(payload);
    // const { error } = await query;
    const { data, error } = await query.select().single();
    if (data) {
      const campaignId = isEditing ? campaign?.id : data.id;

      if (isEditing && campaignId) {
        await supabase
          .from("campaign_products")
          .delete()
          .eq("campaign_id", campaignId);
      }

      if (campaignId && selectedProducts.length > 0) {
        await supabase.from("campaign_products").insert(
          selectedProducts.map((product) => ({
            campaign_id: campaignId,
            product_id: product.id,
          }))
        );
      }
    }
    if (error) {
      setFeedback(error.message);
      return;
    }

    onSaved?.();

    if (redirectTo) {
      startTransition(() => {
        router.push(redirectTo);
        router.refresh();
      });
      return;
    }

    // if (!isEditing) {
    //   setForm(initialForm);
    //   setSelectedProducts([]);
    //   setProductSearch("");
    // }
    if (!isEditing) {

      setForm(
        initialForm
      );

      setSelectedProducts(
        []
      );

      setProductSearch(
        ""
      );

      setStep(
        1
      );

    }
    setFeedback(
      isEditing ? "Campaign updated successfully." : "Campaign created successfully.",
    );
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="mb-8 flex items-center gap-4">

        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex items-center gap-3"
        >

          <div
            className={`
        flex h-12 w-12 items-center justify-center
        rounded-full
        border-2
        text-sm
        font-semibold
        transition

        ${step === 1
                ? "border-blue-600 bg-blue-600 text-white"
                : step > 1
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-500"
              }
      `}
          >

            {step > 1 ? "✓" : "1"}

          </div>


          <div className="text-left">

            <p
              className={`
          text-sm
          font-medium

          ${step >= 1
                  ? "text-slate-900"
                  : "text-slate-500"
                }
        `}
            >

              Campaign Info

            </p>

            <p className="text-xs text-slate-500">

              Basics + products

            </p>

          </div>

        </button>



        <div
          className={`
      h-[2px]
      flex-1
      transition

      ${step >= 2
              ? "bg-blue-600"
              : "bg-slate-200"
            }
    `}
        />




        <button
          type="button"

          onClick={() => {

            if (
              canProceedToStep2()
            ) {

              setStep(2);

            }

          }}

          className="flex items-center gap-3"
        >

          <div
            className={`
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-full
        border-2
        text-sm
        font-semibold
        transition

        ${step === 2
                ?
                "border-blue-600 bg-blue-600 text-white"
                :
                "border-slate-200 bg-white text-slate-500"
              }
      `}
          >

            2

          </div>


          <div className="text-left">

            <p
              className={`
          text-sm
          font-medium

          ${step >= 2
                  ? "text-slate-900"
                  : "text-slate-500"
                }

        `}
            >

              Brief & Settings

            </p>

            <p className="text-xs text-slate-500">

              Deliverables + requirements

            </p>

          </div>

        </button>

      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {step === 1 && <>
          <div className="md:col-span-2">
            <label
              htmlFor="brand-campaign-title"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Campaign title
            </label>
            <input
              id="brand-campaign-title"
              required
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Holiday creator gifting launch"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>

          {/* <div>
          <label
            htmlFor="brand-campaign-product-name"
            className="mb-2 block text-sm font-medium text-slate-600"
          >
            Product or service
          </label>
          <input
            id="brand-campaign-product-name"
            required
            value={form.productName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                productName: event.target.value,
              }))
            }
            placeholder="Hydrating serum launch"
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
          />
        </div> */}
          <div>
            <label
              htmlFor="brand-campaign-content-type"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Content type
            </label>
            <select
              id="brand-campaign-content-type"
              value={form.contentType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contentType: event.target.value,
                }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            >
              {[
                "UGC Video",
                "Testimonial Video",
                "Product Photography",
                "Short-form Ad",
                "Lifestyle Reel",
              ].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="brand-campaign-budget"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Budget
            </label>
            <input
              id="brand-campaign-budget"
              type="number"
              min="0"
              required
              value={form.budget}
              onChange={(event) =>
                setForm((current) => ({ ...current, budget: event.target.value }))
              }
              placeholder="4500"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>
          <div>
            <label
              htmlFor="brand-campaign-platforms"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Platforms
            </label>
            <input
              id="brand-campaign-platforms"
              required
              value={form.platforms}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  platforms: event.target.value,
                }))
              }
              placeholder="Instagram Reels, TikTok"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>
          <div>
            <label
              htmlFor="brand-campaign-slots"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Creator slots
            </label>
            <input
              id="brand-campaign-slots"
              type="number"
              min="1"
              required
              value={form.creatorSlots}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  creatorSlots: event.target.value,
                }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="brand-campaign-product-search"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Product picker
            </label>
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              {/* {selectedProducts.length > 0 && <input
              id="brand-campaign-product-search"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              placeholder="Search synced products by title, vendor, or type"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />} */}
              <input
                id="brand-campaign-product-search"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Search synced products by title, vendor, or type"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedProducts.length > 0 ? (
                  selectedProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleToggleProduct(product)}
                      className="inline-flex items-center gap-3 rounded-full border border-accent/20 bg-white py-2 pl-2 pr-3 text-xs font-semibold text-slate-700 transition hover:border-accent/40 hover:bg-accent/5"
                    >
                      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            {product.title.slice(0, 1)}
                          </span>
                        )}
                      </span>
                      <span>{product.title}</span>
                      <span className="text-slate-400">✕</span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    No product selected yet. Search and tap products to add them.
                  </p>
                )}
              </div>
              <div
                ref={productListRef}
                className="mt-4 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white"
              >
                <div className="grid gap-3 p-3">
                  {storeProducts.map((product) => {
                    const isSelected = selectedProductIds.has(product.id);

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleToggleProduct(product)}
                        className={`rounded-3xl border px-4 py-4 text-left transition ${isSelected
                          ? "border-accent/30 bg-[rgba(7,107,210,0.06)] shadow-[0_10px_30px_rgba(7,107,210,0.08)]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                            {product.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image_url}
                                alt={product.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-bold uppercase text-slate-400">
                                {product.title.slice(0, 1)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {product.title}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {[product.vendor, product.product_type]
                                    .filter(Boolean)
                                    .join(" | ") || "Synced brand product"}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${isSelected
                                  ? "bg-accent text-white"
                                  : "bg-slate-100 text-slate-600"
                                  }`}
                              >
                                {isSelected ? "Selected" : "Select"}
                              </span>
                            </div>
                            {product.price !== null ? (
                              <p className="mt-3 text-sm font-medium text-slate-700">
                                {product.currency ?? "USD"} {product.price}
                              </p>
                            ) : null}
                            {/* <p className="mt-2 text-xs text-slate-400">
                            Click to {isSelected ? "remove from" : "add to"} campaign
                          </p> */}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {isLoadingProducts ? (
                    <p className="px-1 py-6 text-center text-sm text-slate-500">
                      Loading products...
                    </p>
                  ) : null}
                  {!isLoadingProducts && storeProducts.length === 0 ? (
                    <p className="px-1 py-6 text-center text-sm text-slate-500">
                      {productSearch.trim()
                        ? "No products matched your search."
                        : "No synced brand products available yet."}
                    </p>
                  ) : null}
                  {isLoadingMoreProducts ? (
                    <p className="px-1 py-4 text-center text-xs text-slate-500">
                      Loading more products...
                    </p>
                  ) : null}
                  <div ref={loadMoreRef} className="h-1 w-full" />
                </div>
              </div>
            </div>
          </div>
        </>}

        {step === 2 && <>
          <div className="md:col-span-2">
            <label
              htmlFor="brand-campaign-description"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Brief
            </label>
            <textarea
              id="brand-campaign-description"
              required
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Describe the angle, creator profile, and content style you want."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="brand-campaign-product-details"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Product or service details
            </label>
            <textarea
              id="brand-campaign-product-details"
              rows={3}
              value={form.productDetails}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  productDetails: event.target.value,
                }))
              }
              placeholder="Include the offer, differentiators, target use case, and anything creators need to know about the product."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="brand-campaign-deliverables"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Deliverables
            </label>
            <textarea
              id="brand-campaign-deliverables"
              required
              rows={3}
              value={form.deliverables}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  deliverables: event.target.value,
                }))
              }
              placeholder="1 reel, 3 photos, 1 testimonial video"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>
          <div>
            <label
              htmlFor="brand-campaign-duration"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Timeline
            </label>
            <input
              id="brand-campaign-duration"
              required
              value={form.duration}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  duration: event.target.value,
                }))
              }
              placeholder="14 days"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>
          <div>
            <label
              htmlFor="brand-campaign-deadline"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Deadline
            </label>
            <input
              id="brand-campaign-deadline"
              type="date"
              value={form.deadline}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  deadline: event.target.value,
                }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>
          <div>
            <label
              htmlFor="brand-campaign-payment-type"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Payment type
            </label>
            <select
              id="brand-campaign-payment-type"
              value={form.paymentType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  paymentType: event.target.value,
                }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            >
              {["Fixed", "Per deliverable", "Hybrid"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="brand-campaign-status"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Campaign status
            </label>
            <select
              id="brand-campaign-status"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as CampaignStatus,
                }))
              }
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            >
              {[
                { value: "open", label: "Open" },
                { value: "in_review", label: "In review" },
                { value: "active", label: "Active" },
                { value: "completed", label: "Completed" },
              ].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="brand-campaign-usage-rights"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Usage rights
            </label>
            <textarea
              id="brand-campaign-usage-rights"
              rows={3}
              value={form.usageRights}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  usageRights: event.target.value,
                }))
              }
              placeholder="Organic social for 90 days, paid social whitelisting for 30 days, web usage allowed."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="brand-campaign-creator-requirements"
              className="mb-2 block text-sm font-medium text-slate-600"
            >
              Creator requirements
            </label>
            <textarea
              id="brand-campaign-creator-requirements"
              rows={3}
              value={form.creatorRequirements}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  creatorRequirements: event.target.value,
                }))
              }
              placeholder="Looking for skincare creators with strong hook delivery, clean bathroom aesthetic, and prior paid usage experience."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
            />
          </div>
        </>}
      </div>
      {/* <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {isEditing
            ? "Update the brief, timing, and campaign state from one place."
            : "Launch a brief directly into the marketplace."}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {cancelLabel ?? (isEditing ? "Cancel edit" : "Cancel")}
            </button>
          ) : cancelHref ? (
            <Link
              href={cancelHref}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {cancelLabel ?? "Back"}
            </Link>
          ) : null}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? isEditing
                ? "Saving..."
                : "Launching..."
              : isEditing
                ? "Save campaign"
                : "Launch campaign"}
          </button>
        </div>
      </div> */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <p className="text-sm text-slate-500">

          Step {step} of 2

        </p>


        <div className="flex gap-3">


          {(onCancel && step === 1) ? (

            <button
              type="button"
              onClick={onCancel}
              className="
        h-12
        px-5
        rounded-2xl
        border
        border-slate-200
        "
            >

              {cancelLabel ??
                "Cancel"}

            </button>

          ) : null}



          {step === 2 && (

            <button

              type="button"

              onClick={() =>
                setStep(1)
              }

              className="
        h-12
        px-5
        rounded-2xl
        border
        border-slate-200
        "

            >

              Back

            </button>

          )}



          {step === 1 ? (

            <button

              type="button"

              onClick={() =>
                setStep(2)
              }

              disabled={
                !canProceedToStep2()
              }

              className="
        h-12
        px-5
        rounded-2xl
        bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)]
        text-white
        disabled:opacity-50
        "

            >

              Continue

            </button>

          )

            :

            (

              <button

                type="submit"

                disabled={
                  isPending
                }

                className="
        h-12
        px-5
        rounded-2xl
        bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)]
        text-white
        "

              >

                {

                  isPending

                    ?

                    "Saving..."

                    :

                    isEditing

                      ?

                      "Save campaign"

                      :

                      "Launch campaign"

                }

              </button>

            )}

        </div>

      </div>
      {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
    </form>
  );
}
