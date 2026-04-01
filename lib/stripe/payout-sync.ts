import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

export const PAYOUT_SELECT =
  "id, campaign_id, submission_id, brand_id, creator_id, application_id, source_funding_id, amount, platform_fee_percent, platform_fee_amount, creator_amount, currency, status, stripe_transfer_id, stripe_account_id, stripe_source_charge_id, stripe_transfer_group, reversed_amount, failure_reason, created_at, updated_at, paid_at, reversed_at";

function resolveDestinationAccount(transfer: Stripe.Transfer) {
  return typeof transfer.destination === "string"
    ? transfer.destination
    : transfer.destination?.id ?? null;
}

function resolveSourceCharge(transfer: Stripe.Transfer) {
  return typeof transfer.source_transaction === "string"
    ? transfer.source_transaction
    : transfer.source_transaction?.id ?? null;
}

export async function syncCampaignPayoutFromTransfer(
  admin: AdminClient,
  transfer: Stripe.Transfer,
) {
  const payoutId = transfer.metadata?.payout_id?.trim() || null;
  const sourceFundingId = transfer.metadata?.source_funding_id?.trim() || null;
  const reversedAmount = Math.max((transfer.amount_reversed ?? 0) / 100, 0);
  const isReversed = Boolean(transfer.reversed) || reversedAmount > 0;

  const payoutQuery = payoutId
    ? admin.from("campaign_payouts").select(PAYOUT_SELECT).eq("id", payoutId)
    : admin
        .from("campaign_payouts")
        .select(PAYOUT_SELECT)
        .eq("stripe_transfer_id", transfer.id);

  const { data: existingPayout, error: lookupError } = await payoutQuery.maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (!existingPayout) {
    return null;
  }

  const nextStatus = isReversed ? "reversed" : "paid";
  const { data: updatedPayout, error: updateError } = await admin
    .from("campaign_payouts")
    .update({
      status: nextStatus,
      source_funding_id: sourceFundingId ?? existingPayout.source_funding_id ?? null,
      stripe_transfer_id: transfer.id,
      stripe_account_id: resolveDestinationAccount(transfer),
      stripe_source_charge_id:
        resolveSourceCharge(transfer) ??
        existingPayout.stripe_source_charge_id ??
        null,
      stripe_transfer_group:
        transfer.transfer_group ??
        existingPayout.stripe_transfer_group ??
        null,
      reversed_amount: reversedAmount,
      failure_reason: isReversed
        ? "Stripe reversed this transfer."
        : null,
      paid_at: existingPayout.paid_at ?? new Date().toISOString(),
      reversed_at: isReversed ? new Date().toISOString() : null,
    })
    .eq("id", existingPayout.id)
    .select(PAYOUT_SELECT)
    .single();

  if (updateError || !updatedPayout) {
    throw new Error(updateError?.message ?? "Unable to reconcile Stripe transfer.");
  }

  return updatedPayout;
}
