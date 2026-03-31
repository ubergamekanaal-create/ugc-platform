"use client";

import type { CreatorPayoutSummary, UserProfile } from "@/lib/types";
import {
  cn,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/utils";
import { StripeActionButton } from "@/components/dashboard/stripe-action-button";

type CreatorPayoutsPanelProps = {
  profile: UserProfile & { role: "creator" };
  payouts: CreatorPayoutSummary[];
};

function getStatusClasses(status: CreatorPayoutSummary["status"]) {
  if (status === "paid") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "failed" || status === "reversed") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-amber-50 text-amber-700";
}

function getStatusLabel(status: CreatorPayoutSummary["status"]) {
  if (status === "payout_ready") {
    return "Awaiting brand release";
  }

  if (status === "reversed") {
    return "Reversed";
  }

  return status;
}

function getPayoutSetupState(profile: UserProfile & { role: "creator" }) {
  if (
    profile.stripe_account_id &&
    profile.stripe_onboarding_complete &&
    profile.stripe_payouts_enabled &&
    profile.stripe_transfers_enabled
  ) {
    return {
      badge: "Ready for payouts",
      badgeClassName: "bg-emerald-50 text-emerald-700",
      title: "Stripe confirms your payout account is active.",
      description:
        "You can open the Stripe Express dashboard to manage bank details and tax information.",
      actionLabel: "Open Stripe dashboard",
    };
  }

  if (profile.stripe_account_id) {
    return {
      badge: "Action required",
      badgeClassName: "bg-amber-50 text-amber-700",
      title: "Finish Stripe onboarding to unlock creator payouts.",
      description:
        "We have your connected account, but Stripe still needs the remaining payout details before brands can release money.",
      actionLabel: "Continue Stripe onboarding",
    };
  }

  return {
    badge: "Not connected",
    badgeClassName: "bg-slate-100 text-slate-700",
    title: "Connect Stripe to unlock payouts.",
    description:
      "Start the hosted Stripe Express onboarding flow so approved creator earnings can be transferred to you.",
    actionLabel: "Connect Stripe",
  };
}

export function CreatorPayoutsPanel({
  profile,
  payouts,
}: CreatorPayoutsPanelProps) {
  const paidTotal = payouts
    .filter((payout) => payout.status === "paid")
    .reduce((sum, payout) => sum + payout.creator_amount, 0);
  const readyTotal = payouts
    .filter((payout) => payout.status === "payout_ready")
    .reduce((sum, payout) => sum + payout.creator_amount, 0);
  const commissionTotal = payouts.reduce(
    (sum, payout) => sum + payout.platform_fee_amount,
    0,
  );
  const payoutSetup = getPayoutSetupState(profile);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Ready for payout",
            value: formatCompactCurrency(readyTotal || 0),
          },
          {
            label: "Paid out",
            value: formatCompactCurrency(paidTotal || 0),
          },
          {
            label: "Platform commission",
            value: formatCompactCurrency(commissionTotal || 0),
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

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                Payout Setup
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Connect Stripe Express so approved creator earnings can be transferred to you.
              </p>
            </div>
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                payoutSetup.badgeClassName,
              )}
            >
              {payoutSetup.badge}
            </span>
          </div>
          <div className="mt-8 rounded-[1.75rem] bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Next action</p>
            <p className="mt-2 text-xl font-semibold text-slate-950">
              {payoutSetup.title}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {payoutSetup.description}
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                {
                  label: "Details submitted",
                  value: profile.stripe_details_submitted ? "Yes" : "No",
                },
                {
                  label: "Payouts enabled",
                  value: profile.stripe_payouts_enabled ? "Yes" : "No",
                },
                {
                  label: "Transfers enabled",
                  value: profile.stripe_transfers_enabled ? "Yes" : "No",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <StripeActionButton
                endpoint="/api/stripe/connect"
                label={payoutSetup.actionLabel}
                pendingLabel="Opening Stripe..."
                tone="light"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
            Earnings Timeline
          </h2>
          <div className="mt-8 space-y-4">
            {payouts.length ? (
              payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {payout.campaign_title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {payout.brand_name} •{" "}
                      {formatDate(payout.paid_at ?? payout.created_at)}
                    </p>
                    {payout.failure_reason ? (
                      <p className="mt-2 text-sm text-rose-600">
                        {payout.failure_reason}
                      </p>
                    ) : null}
                    {payout.status === "reversed" && payout.reversed_amount > 0 ? (
                      <p className="mt-2 text-sm text-rose-600">
                        Reversed {formatCurrency(payout.reversed_amount)} from this transfer.
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-slate-500">
                      Gross {formatCurrency(payout.amount)} • Fee{" "}
                      {formatCurrency(payout.platform_fee_amount)} (
                      {formatPercent(payout.platform_fee_percent)}) • Net{" "}
                      {formatCurrency(payout.creator_amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-950">
                      {formatCurrency(payout.creator_amount)}
                    </p>
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusClasses(payout.status),
                      )}
                    >
                      {getStatusLabel(payout.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500">
                Approved payouts will appear here once a brand reviews and funds your work.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
