"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  BrandCampaignSummary,
  BrandCreatorDirectoryEntry,
} from "@/lib/types";
import { cn, formatCompactCurrency, formatDate, getInitials } from "@/lib/utils";

type BrandCreatorDirectoryProps = {
  brandId: string;
  campaigns: BrandCampaignSummary[];
  creators: BrandCreatorDirectoryEntry[];
};

function getDefaultCampaignId(
  creator: BrandCreatorDirectoryEntry,
  campaigns: BrandCampaignSummary[],
) {
  return (
    campaigns.find((campaign) => !creator.invited_campaign_ids.includes(campaign.id))
      ?.id ?? ""
  );
}

export function BrandCreatorDirectory({
  brandId,
  campaigns,
  creators,
}: BrandCreatorDirectoryProps) {
  const router = useRouter();
  const [selectedCampaigns, setSelectedCampaigns] = useState<Record<string, string>>(
    {},
  );
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [offeredRates, setOfferedRates] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [pendingCreatorId, setPendingCreatorId] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  const inviteableCampaigns = useMemo(
    () => campaigns.filter((campaign) => campaign.status !== "completed"),
    [campaigns],
  );

  async function handleInvite(creator: BrandCreatorDirectoryEntry) {
    const campaignId =
      selectedCampaigns[creator.id] || getDefaultCampaignId(creator, inviteableCampaigns);

    if (!campaignId) {
      setFeedback((current) => ({
        ...current,
        [creator.id]: "Create a campaign before sending invites.",
      }));
      return;
    }

    setPendingCreatorId(creator.id);
    setFeedback((current) => ({ ...current, [creator.id]: "" }));

    const supabase = createClient();
    const { error } = await supabase.from("campaign_invitations").upsert(
      {
        brand_id: brandId,
        creator_id: creator.id,
        campaign_id: campaignId,
        message: messages[creator.id]?.trim() || null,
        offered_rate: Number(offeredRates[creator.id] || 0),
        status: "pending",
      },
      {
        onConflict: "campaign_id,creator_id",
      },
    );

    if (error) {
      setFeedback((current) => ({
        ...current,
        [creator.id]: error.message,
      }));
      setPendingCreatorId(null);
      return;
    }

    setMessages((current) => ({ ...current, [creator.id]: "" }));
    setOfferedRates((current) => ({ ...current, [creator.id]: "" }));
    setFeedback((current) => ({
      ...current,
      [creator.id]: "Invitation sent. Refreshing roster...",
    }));
    setPendingCreatorId(null);
    startRefresh(() => {
      router.refresh();
    });
  }

  if (!creators.length) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        Creator profiles will appear here once creator accounts exist in your
        workspace.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {creators.map((creator) => {
        const availableCampaigns = inviteableCampaigns.filter(
          (campaign) => !creator.invited_campaign_ids.includes(campaign.id),
        );
        const selectedCampaignId =
          selectedCampaigns[creator.id] ||
          getDefaultCampaignId(creator, inviteableCampaigns);

        return (
          <div
            key={creator.id}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-slate-900 text-sm font-semibold text-white">
                  {getInitials(creator.name)}
                </span>
                <div>
                  <p className="text-xl font-semibold text-slate-950">
                    {creator.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {creator.headline ?? creator.focus}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-accent">
                {creator.pending_invitations > 0
                  ? `${creator.pending_invitations} pending`
                  : creator.focus}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Apps
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {creator.applications}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Won
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {creator.accepted}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Rate
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {creator.rate > 0 ? formatCompactCurrency(creator.rate) : "New"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Invites
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {creator.invitations}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">
                {creator.latest_campaign_title
                  ? `Latest campaign: ${creator.latest_campaign_title}`
                  : "No submissions yet from this creator."}
              </p>
              <p className="mt-2">
                {creator.last_invited_at
                  ? `Last invited ${formatDate(creator.last_invited_at)}`
                  : "Ready for outbound campaign invites."}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <label
                  htmlFor={`offer-rate-${creator.id}`}
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Offer rate
                </label>
                <input
                  id={`offer-rate-${creator.id}`}
                  type="number"
                  min="0"
                  value={offeredRates[creator.id] ?? ""}
                  onChange={(event) =>
                    setOfferedRates((current) => ({
                      ...current,
                      [creator.id]: event.target.value,
                    }))
                  }
                  placeholder="750"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>

              <div>
                <label
                  htmlFor={`campaign-${creator.id}`}
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Invite to campaign
                </label>
                <select
                  id={`campaign-${creator.id}`}
                  value={selectedCampaignId}
                  onChange={(event) =>
                    setSelectedCampaigns((current) => ({
                      ...current,
                      [creator.id]: event.target.value,
                    }))
                  }
                  disabled={!availableCampaigns.length}
                  className={cn(
                    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]",
                    !availableCampaigns.length && "cursor-not-allowed bg-slate-100 text-slate-400",
                  )}
                >
                  {availableCampaigns.length ? (
                    availableCampaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </option>
                    ))
                  ) : (
                    <option value="">Already invited to all campaigns</option>
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`message-${creator.id}`}
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Invite note
                </label>
                <textarea
                  id={`message-${creator.id}`}
                  rows={3}
                  value={messages[creator.id] ?? ""}
                  onChange={(event) =>
                    setMessages((current) => ({
                      ...current,
                      [creator.id]: event.target.value,
                    }))
                  }
                  placeholder="Share the brief angle, timeline, or product context."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => void handleInvite(creator)}
                disabled={pendingCreatorId === creator.id || !availableCampaigns.length}
                className="flex-1 rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingCreatorId === creator.id ? "Sending..." : "Invite to campaign"}
              </button>
              <button
                type="button"
                disabled
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-400"
              >
                Profile soon
              </button>
            </div>

            {feedback[creator.id] ? (
              <p className="mt-4 text-sm text-slate-500">{feedback[creator.id]}</p>
            ) : null}
          </div>
        );
      })}

      {isRefreshing ? (
        <div className="md:col-span-2 xl:col-span-3 text-sm text-slate-500">
          Refreshing creator roster...
        </div>
      ) : null}
    </div>
  );
}
