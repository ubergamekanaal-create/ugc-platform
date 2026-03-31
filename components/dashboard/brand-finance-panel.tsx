"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StripeActionButton } from "@/components/dashboard/stripe-action-button";
import type {
  BrandCampaignSummary,
  BrandFundingSummary,
  BrandPayoutSummary,
} from "@/lib/types";
import {
  cn,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/utils";

type BrandFinancePanelProps = {
  campaigns: BrandCampaignSummary[];
  fundings: BrandFundingSummary[];
  payouts: BrandPayoutSummary[];
};

function getFundingStatusClasses(status: BrandFundingSummary["status"]) {
  if (status === "paid") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "failed" || status === "cancelled") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-blue-50 text-blue-700";
}

function getPayoutStatusClasses(status: BrandPayoutSummary["status"]) {
  if (status === "paid") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "failed" || status === "reversed") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-amber-50 text-amber-700";
}

function getPayoutStatusLabel(status: BrandPayoutSummary["status"]) {
  if (status === "payout_ready") {
    return "ready for release";
  }

  if (status === "reversed") {
    return "reversed";
  }

  return status;
}

export function BrandFinancePanel({
  campaigns,
  fundings,
  payouts,
}: BrandFinancePanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirmationRef = useRef<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    campaigns[0]?.id ?? "",
  );
  const [amount, setAmount] = useState<string>(
    campaigns[0] ? String(Math.max(campaigns[0].budget, 100)) : "1000",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});
  const [pendingPayoutId, setPendingPayoutId] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  useEffect(() => {
    if (!campaigns.length) {
      setSelectedCampaignId("");
      return;
    }

    if (!campaigns.some((campaign) => campaign.id === selectedCampaignId)) {
      setSelectedCampaignId(campaigns[0].id);
      setAmount(String(Math.max(campaigns[0].budget, 100)));
    }
  }, [campaigns, selectedCampaignId]);

  const selectedCampaign =
    campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;
  const paidFundingTotal = fundings
    .filter((funding) => funding.status === "paid")
    .reduce((sum, funding) => sum + funding.amount, 0);
  const paidPayoutTotal = payouts
    .filter((payout) => payout.status === "paid")
    .reduce((sum, payout) => sum + payout.creator_amount, 0);
  const payoutReadyTotal = payouts
    .filter((payout) => payout.status === "payout_ready")
    .reduce((sum, payout) => sum + payout.creator_amount, 0);
  const totalCommissionCaptured = payouts
    .filter((payout) => payout.status === "paid")
    .reduce((sum, payout) => sum + payout.platform_fee_amount, 0);
  const totalCommissionQueued = payouts
    .filter((payout) => payout.status === "payout_ready")
    .reduce((sum, payout) => sum + payout.platform_fee_amount, 0);
  const availableBalance = paidFundingTotal - paidPayoutTotal;
  const actionablePayouts = payouts.filter(
    (payout) => payout.status === "payout_ready" || payout.status === "failed",
  );
  const fundingTimeline = fundings.slice(0, 6);
  const recentReleased = payouts.slice(0, 6);
  const paymentStatus = searchParams.get("payment");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (paymentStatus !== "success" || !sessionId || confirmationRef.current === sessionId) {
      return;
    }

    confirmationRef.current = sessionId;

    void (async () => {
      try {
        const response = await fetch("/api/stripe/checkout/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              error?: string;
              funding?: Pick<BrandFundingSummary, "status">;
            }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to confirm Stripe payment.");
        }

        if (payload?.funding?.status === "paid") {
          setMessage("Funding received and recorded to your campaign balance.");
        } else if (payload?.funding?.status === "pending") {
          setMessage(
            "Payment submitted. Stripe is still confirming it, and the balance will update as soon as the webhook lands.",
          );
        } else if (payload?.funding?.status === "cancelled") {
          setMessage("This Stripe checkout session expired before payment completed.");
        } else if (payload?.funding?.status === "failed") {
          setMessage("Stripe marked this funding attempt as failed.");
        } else {
          setMessage("Funding status refreshed.");
        }

        startRefresh(() => {
          router.refresh();
          router.replace("/dashboard/finance");
        });
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Unable to confirm Stripe payment.",
        );
      }
    })();
  }, [paymentStatus, router, sessionId, startRefresh]);

  async function handleReleasePayout(payoutId: string) {
    setPendingPayoutId(payoutId);
    setActionFeedback((current) => ({ ...current, [payoutId]: "" }));

    try {
      const response = await fetch("/api/stripe/payouts/release", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payoutId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to release payout.");
      }

      setActionFeedback((current) => ({
        ...current,
        [payoutId]: "Payout released. Refreshing finance view...",
      }));
      startRefresh(() => {
        router.refresh();
      });
    } catch (error) {
      setActionFeedback((current) => ({
        ...current,
        [payoutId]:
          error instanceof Error ? error.message : "Unable to release payout.",
      }));
    } finally {
      setPendingPayoutId(null);
    }
  }

  const topUpAmount = Math.max(100, Math.round(Number(amount || 0) || 0));
  const topUpDisabled = !selectedCampaignId || topUpAmount <= 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Funded balance",
            value: formatCompactCurrency(paidFundingTotal || 0),
          },
          {
            label: "Available to release",
            value: formatCompactCurrency(Math.max(availableBalance, 0)),
          },
          {
            label: "Queued payouts",
            value: formatCompactCurrency(payoutReadyTotal || 0),
          },
          {
            label: "Platform commission",
            value: formatCompactCurrency(
              totalCommissionCaptured + totalCommissionQueued || 0,
            ),
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
          >
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {message ? (
        <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-accent">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                Fund Campaigns
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Route brand payments into campaign balances before releasing creator payouts.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-accent">
              Stripe Checkout
            </span>
          </div>

          {campaigns.length ? (
            <div className="mt-8 grid gap-4 rounded-[1.75rem] bg-slate-50 p-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Campaign
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={(event) => {
                    const nextCampaign = campaigns.find(
                      (campaign) => campaign.id === event.target.value,
                    );
                    setSelectedCampaignId(event.target.value);
                    setAmount(String(Math.max(nextCampaign?.budget ?? 100, 100)));
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                >
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  Amount
                </label>
                <input
                  type="number"
                  min="100"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-white px-4 py-4">
                <div>
                  <p className="text-sm text-slate-500">Funding target</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {formatCurrency(topUpAmount || 0)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                  {selectedCampaign?.title ?? "Select campaign"}
                </span>
              </div>
              <StripeActionButton
                endpoint="/api/stripe/checkout"
                payload={{
                  campaignId: selectedCampaignId || null,
                  title: selectedCampaign?.title ?? "Campaign wallet top-up",
                  amount: topUpAmount,
                }}
                label="Top up with Stripe"
                pendingLabel="Redirecting to Stripe..."
                tone="light"
                disabled={topUpDisabled}
              />
            </div>
          ) : (
            <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
              Create a campaign first, then fund it through Stripe Checkout.
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                Release Creator Payouts
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Approved submissions land here as payout-ready obligations.
              </p>
            </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              {actionablePayouts.length} actionable
              </span>
          </div>

          <div className="mt-8 space-y-4">
            {actionablePayouts.length ? (
              actionablePayouts.map((payout) => (
                <div
                  key={payout.id}
                  className="rounded-[1.5rem] border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {payout.creator_name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {payout.campaign_title}
                      </p>
                      {payout.creator_headline ? (
                        <p className="mt-2 text-sm text-slate-500">
                          {payout.creator_headline}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-slate-950">
                        {formatCurrency(payout.creator_amount)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Created {formatDate(payout.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 rounded-[1.25rem] bg-slate-50 p-4 text-sm text-slate-600 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Gross payout
                      </p>
                      <p className="mt-2 font-semibold text-slate-950">
                        {formatCurrency(payout.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Platform fee
                      </p>
                      <p className="mt-2 font-semibold text-slate-950">
                        {formatCurrency(payout.platform_fee_amount)}{" "}
                        <span className="text-sm font-medium text-slate-500">
                          ({formatPercent(payout.platform_fee_percent)})
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Creator receives
                      </p>
                      <p className="mt-2 font-semibold text-slate-950">
                        {formatCurrency(payout.creator_amount)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        getPayoutStatusClasses(payout.status),
                      )}
                    >
                      {getPayoutStatusLabel(payout.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleReleasePayout(payout.id)}
                      disabled={
                        pendingPayoutId === payout.id || payout.status === "paid"
                      }
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingPayoutId === payout.id
                        ? "Releasing..."
                        : payout.status === "failed"
                          ? "Retry payout"
                          : "Release payout"}
                    </button>
                  </div>
                  {actionFeedback[payout.id] ? (
                    <p className="mt-3 text-sm text-slate-500">
                      {actionFeedback[payout.id]}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
                Approved submissions will appear here once they are ready to pay.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
            Funding Timeline
          </h2>
          <div className="mt-8 space-y-4">
            {fundingTimeline.length ? (
              fundingTimeline.map((funding) => (
                <div
                  key={funding.id}
                  className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {funding.campaign_title ?? "Wallet top-up"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          getFundingStatusClasses(funding.status),
                        )}
                      >
                        {funding.status}
                      </span>
                      <span className="text-sm text-slate-500">
                        {formatDate(funding.paid_at ?? funding.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-slate-950">
                    {formatCurrency(funding.amount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
                Funding events will appear here after the first successful Stripe checkout.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
            Payout History
          </h2>
          <div className="mt-8 space-y-4">
            {recentReleased.length ? (
              recentReleased.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {payout.creator_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {payout.campaign_title}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Gross {formatCurrency(payout.amount)} • Fee{" "}
                      {formatCurrency(payout.platform_fee_amount)} • Net{" "}
                      {formatCurrency(payout.creator_amount)}
                    </p>
                    {payout.failure_reason ? (
                      <p className="mt-2 text-sm text-rose-600">
                        {payout.failure_reason}
                      </p>
                    ) : null}
                    {payout.status === "reversed" && payout.reversed_amount > 0 ? (
                      <p className="mt-2 text-sm text-rose-600">
                        Reversed {formatCurrency(payout.reversed_amount)} back to the platform balance.
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-950">
                      {formatCurrency(payout.creator_amount)}
                    </p>
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getPayoutStatusClasses(payout.status),
                      )}
                    >
                      {getPayoutStatusLabel(payout.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
                Released, reversed, and failed transfer attempts will appear here.
              </div>
            )}
          </div>
        </div>
      </div>

      {isRefreshing ? (
        <p className="text-sm text-slate-500">Refreshing finance data...</p>
      ) : null}
    </div>
  );
}
