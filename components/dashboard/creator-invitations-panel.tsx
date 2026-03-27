"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CreatorInvitationSummary, InvitationStatus } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

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
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-2xl font-semibold text-slate-950">
                  {invitation.campaign_title}
                </h3>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    getStatusClasses(invitation.status),
                  )}
                >
                  {invitation.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-accent">
                {invitation.brand_name}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {invitation.message?.trim() ||
                  invitation.campaign_description ||
                  "This brand wants to work with you on the campaign below."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {invitation.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid min-w-[250px] gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Offer</span>
                <span className="font-semibold text-slate-950">
                  {invitation.offered_rate > 0
                    ? formatCurrency(invitation.offered_rate)
                    : "TBD"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Budget</span>
                <span className="font-semibold text-slate-950">
                  {formatCurrency(invitation.campaign_budget)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Deliverables</span>
                <span className="max-w-[140px] text-right font-medium text-slate-950">
                  {invitation.deliverables || "Shared in brief"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Timeline</span>
                <span className="font-medium text-slate-950">
                  {invitation.duration}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Sent</span>
                <span className="font-medium text-slate-950">
                  {formatDate(invitation.created_at)}
                </span>
              </div>
            </div>
          </div>

          {invitation.status === "pending" ? (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleInvitationAction(invitation.id, "accept")}
                disabled={pendingInvitationId === invitation.id}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingInvitationId === invitation.id ? "Processing..." : "Accept invitation"}
              </button>
              <button
                type="button"
                onClick={() => void handleInvitationAction(invitation.id, "decline")}
                disabled={pendingInvitationId === invitation.id}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          ) : null}

          {feedback[invitation.id] ? (
            <p className="mt-4 text-sm text-slate-500">{feedback[invitation.id]}</p>
          ) : null}
        </div>
      ))}

      {isRefreshing ? (
        <p className="text-sm text-slate-500">Refreshing invitations...</p>
      ) : null}
    </div>
  );
}
