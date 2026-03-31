"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { BrandCampaignSummary, CampaignStatus } from "@/lib/types";

type BrandCampaignComposerProps = {
  brandId: string;
  campaign?: BrandCampaignSummary | null;
  onCancel?: () => void;
  onSaved?: () => void;
  cancelHref?: string;
  cancelLabel?: string;
  redirectTo?: string;
};

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
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(campaign);

  useEffect(() => {
    setForm(buildCampaignForm(campaign));
    setFeedback(null);
  }, [campaign]);

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
    const { error } = await query;

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

    if (!isEditing) {
      setForm(initialForm);
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
      <div className="grid gap-4 md:grid-cols-2">
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
        <div>
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
        </div>
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
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      </div>
      {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
    </form>
  );
}
