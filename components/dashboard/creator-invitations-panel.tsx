"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CreatorInvitationSummary, InvitationStatus } from "@/lib/types";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { HoverLift } from "@/components/shared/motion";

type CreatorInvitationsPanelProps = {
  invitations: CreatorInvitationSummary[];
};

function getStatusClasses(status: InvitationStatus) {
  if (status === "accepted") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "declined") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-blue-50 text-blue-700";
}

function getShortText(value: string | null | undefined, limit = 110) {
  const text = value?.trim();

  if (!text) {
    return "";
  }

  return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
}

export function CreatorInvitationsPanel({
  invitations,
}: CreatorInvitationsPanelProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [pendingInvitationId, setPendingInvitationId] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  async function handleInvitationAction(
    invitationId: string,
    action: "accept" | "decline",
  ) {
    setPendingInvitationId(invitationId);
    setFeedback((current) => ({ ...current, [invitationId]: "" }));

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update invitation.");
      }

      setFeedback((current) => ({
        ...current,
        [invitationId]:
          action === "accept"
            ? "Invitation accepted. Refreshing dashboard..."
            : "Invitation declined. Refreshing dashboard...",
      }));
      startRefresh(() => {
        router.refresh();
      });
    } catch (error) {
      setFeedback((current) => ({
        ...current,
        [invitationId]:
          error instanceof Error ? error.message : "Unable to update invitation.",
      }));
    } finally {
      setPendingInvitationId(null);
    }
  }

  if (!invitations.length) {
    return null;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {invitations.map((invitation) => {
        const note =
          getShortText(invitation.message, 120) ||
          getShortText(invitation.campaign_description, 120) ||
          "This brand wants to work with you on this campaign.";

        return (
          <HoverLift
            key={invitation.id}
            className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_14px_32px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="uppercase flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold uppercase text-accent">
                  {getInitials(invitation.brand_name)}
                </div>
                <div className="min-w-0">
                  <h3 className="capitalize text-base font-semibold leading-6 text-slate-950">
                    {invitation.campaign_title}
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold leading-5 text-accent">
                    {invitation.brand_name}
                    {invitation.brand_headline ? ` - ${invitation.brand_headline}` : ""}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                  getStatusClasses(invitation.status),
                )}
              >
                {invitation.status}
              </span>
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-blue-100 bg-[linear-gradient(135deg,rgba(7,107,210,0.08),rgba(59,130,246,0.04))] p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Offer
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                    {invitation.offered_rate > 0
                      ? formatCurrency(invitation.offered_rate)
                      : "TBD"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Deadline
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {invitation.deadline ? formatDate(invitation.deadline) : "Flexible"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Timeline
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {invitation.duration}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[invitation.content_type, ...invitation.platforms.slice(0, 2)].map(
                (platform, index) => (
                  <span
                    key={`${platform}-${index}`}
                    className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
                  >
                    {platform}
                  </span>
                ),
              )}
              {invitation.deliverables ? (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-accent">
                  {invitation.deliverables}
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">{note}</p>

            <div className="mt-4 grid gap-2 rounded-[1.1rem] border border-slate-100 bg-slate-50 p-3 text-xs">
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500">Product</span>
                <span className="max-w-[65%] text-right font-semibold text-slate-950">
                  {invitation.product_name || "Shared after accept"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500">Campaign budget</span>
                <span className="font-semibold text-slate-950">
                  {formatCurrency(invitation.campaign_budget)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500">Usage rights</span>
                <span className="max-w-[65%] text-right font-semibold text-slate-950">
                  {invitation.usage_rights || "To be confirmed"}
                </span>
              </div>
            </div>

            {invitation.status === "pending" ? (
              <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleInvitationAction(invitation.id, "accept")}
                  disabled={pendingInvitationId === invitation.id}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(7,107,210,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingInvitationId === invitation.id ? "Processing..." : "Accept invitation"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleInvitationAction(invitation.id, "decline")}
                  disabled={pendingInvitationId === invitation.id}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            ) : null}

            {feedback[invitation.id] ? (
              <p className="mt-4 text-sm text-slate-500">{feedback[invitation.id]}</p>
            ) : null}
          </HoverLift>
        );
      })}

      {isRefreshing ? (
        <p className="text-sm text-slate-500 xl:col-span-2">Refreshing invitations...</p>
      ) : null}
    </div>
  );
}
