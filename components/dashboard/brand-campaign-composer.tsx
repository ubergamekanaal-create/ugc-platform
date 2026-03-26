"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type BrandCampaignComposerProps = {
  brandId: string;
};

const initialForm = {
  title: "",
  budget: "",
  platforms: "",
  description: "",
};

export function BrandCampaignComposer({
  brandId,
}: BrandCampaignComposerProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const supabase = createClient();
    const { error } = await supabase.from("campaigns").insert({
      brand_id: brandId,
      title: form.title,
      budget: Number(form.budget),
      description: form.description,
      platforms: form.platforms
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      creator_slots: 3,
      deliverables: "2 videos, usage rights, and stills",
      duration: "14 days",
      payment_type: "Fixed",
      status: "open",
    });

    if (error) {
      setFeedback(error.message);
      return;
    }

    setForm(initialForm);
    setFeedback("Campaign created successfully.");
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
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Launch a brief directly into the marketplace.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Launching..." : "Launch campaign"}
        </button>
      </div>
      {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}
    </form>
  );
}
