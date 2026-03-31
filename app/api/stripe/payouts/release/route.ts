import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  FUNDING_SELECT,
  hydrateFundingChargeDetails,
} from "@/lib/stripe/funding-sync";
import { PAYOUT_SELECT } from "@/lib/stripe/payout-sync";
import { getStripeServerClient } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

type ReleasePayoutBody = {
  payoutId?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "brand") {
    return NextResponse.json(
      { error: "Only brand accounts can release creator payouts." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as ReleasePayoutBody | null;
  const payoutId = body?.payoutId?.trim();

  if (!payoutId) {
    return NextResponse.json(
      { error: "A payout id is required." },
      { status: 400 },
    );
  }

  const stripe = getStripeServerClient();

  if (!stripe) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY." },
      { status: 503 },
    );
  }

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  const { data: payout, error: payoutLookupError } = await supabase
    .from("campaign_payouts")
    .select(PAYOUT_SELECT)
    .eq("id", payoutId)
    .eq("brand_id", profile.id)
    .maybeSingle();

  if (payoutLookupError) {
    return NextResponse.json(
      { error: payoutLookupError.message },
      { status: 400 },
    );
  }

  if (!payout) {
    return NextResponse.json({ error: "Payout not found." }, { status: 404 });
  }

  if (payout.status === "paid") {
    return NextResponse.json({ payout });
  }

  if (payout.status === "reversed") {
    return NextResponse.json(
      {
        error:
          "This payout was reversed in Stripe. Review the funding history before creating a replacement payout.",
      },
      { status: 400 },
    );
  }

  const creatorTransferAmount =
    Number(payout.creator_amount ?? 0) > 0
      ? Number(payout.creator_amount)
      : Number(payout.amount);

  if (creatorTransferAmount <= 0) {
    return NextResponse.json(
      { error: "This payout amount must be greater than zero before release." },
      { status: 400 },
    );
  }

  const [{ data: paidFundings, error: fundingsError }, { data: settledPayouts, error: paidPayoutsError }] =
    await Promise.all([
      supabase
        .from("campaign_fundings")
        .select(FUNDING_SELECT)
        .eq("brand_id", profile.id)
        .eq("campaign_id", payout.campaign_id)
        .eq("status", "paid"),
      supabase
        .from("campaign_payouts")
        .select(
          "id, source_funding_id, creator_amount, amount, status, reversed_amount",
        )
        .eq("brand_id", profile.id)
        .eq("campaign_id", payout.campaign_id)
        .in("status", ["paid", "reversed"]),
    ]);

  if (fundingsError || paidPayoutsError) {
    return NextResponse.json(
      {
        error:
          fundingsError?.message ??
          paidPayoutsError?.message ??
          "Unable to calculate available balance.",
      },
      { status: 400 },
    );
  }

  const fundedAmount = (paidFundings ?? []).reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );
  const releasedAmount = (settledPayouts ?? []).reduce(
    (sum, row) =>
      sum +
      Math.max(
        0,
        Number(
          Number(row.creator_amount ?? 0) > 0
            ? row.creator_amount
            : row.amount ?? 0,
        ) - Number(row.reversed_amount ?? 0),
      ),
    0,
  );
  const availableBalance = fundedAmount - releasedAmount;

  if (availableBalance < creatorTransferAmount) {
    return NextResponse.json(
      { error: "Insufficient funded balance for this campaign." },
      { status: 400 },
    );
  }

  const refreshedFundings = await Promise.all(
    (paidFundings ?? []).map((funding) =>
      hydrateFundingChargeDetails(admin, stripe, funding),
    ),
  );

  const fundingUsage = new Map<string, number>();
  for (const settledPayout of settledPayouts ?? []) {
    if (!settledPayout.source_funding_id) {
      continue;
    }

    const currentUsage = fundingUsage.get(settledPayout.source_funding_id) ?? 0;
    const consumedAmount = Math.max(
      0,
      Number(
        Number(settledPayout.creator_amount ?? 0) > 0
          ? settledPayout.creator_amount
          : settledPayout.amount ?? 0,
      ) - Number(settledPayout.reversed_amount ?? 0),
    );
    fundingUsage.set(settledPayout.source_funding_id, currentUsage + consumedAmount);
  }

  const selectedFunding = refreshedFundings
    .filter(
      (funding) =>
        funding.status === "paid" &&
        funding.stripe_charge_id &&
        Number(funding.amount ?? 0) > 0,
    )
    .sort(
      (left, right) =>
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
    )
    .find((funding) => {
      const consumedAmount = fundingUsage.get(funding.id) ?? 0;
      const remainingAmount = Number(funding.amount ?? 0) - consumedAmount;
      return remainingAmount >= creatorTransferAmount;
    });

  if (!selectedFunding) {
    return NextResponse.json(
      {
        error:
          "No funded Stripe charge is currently available for this payout. Wait for the funding webhook to finish or top up the campaign again.",
      },
      { status: 400 },
    );
  }

  const sourceChargeId = selectedFunding.stripe_charge_id;

  if (!sourceChargeId) {
    return NextResponse.json(
      {
        error:
          "The selected funding source is still missing its Stripe charge id. Wait for the funding webhook to finish and try again.",
      },
      { status: 400 },
    );
  }

  const { data: creatorProfile, error: creatorLookupError } = await admin
    .from("users")
    .select("*")
    .eq("id", payout.creator_id)
    .single();

  if (creatorLookupError || !creatorProfile?.stripe_account_id) {
    return NextResponse.json(
      {
        error: "Creator has not started Stripe payout onboarding yet.",
        payout,
      },
      { status: 400 },
    );
  }

  if (
    !creatorProfile.stripe_payouts_enabled ||
    !creatorProfile.stripe_transfers_enabled ||
    !creatorProfile.stripe_onboarding_complete
  ) {
    return NextResponse.json(
      {
        error:
          "Creator payout onboarding is still incomplete. Ask the creator to finish Stripe onboarding and wait for the status to refresh.",
        payout,
      },
      { status: 400 },
    );
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(creatorTransferAmount * 100),
      currency: payout.currency || "usd",
      destination: creatorProfile.stripe_account_id,
      source_transaction: sourceChargeId,
      transfer_group:
        selectedFunding.stripe_transfer_group ?? `campaign_${payout.campaign_id}`,
      metadata: {
        payout_id: payout.id,
        campaign_id: payout.campaign_id,
        submission_id: payout.submission_id,
        brand_id: payout.brand_id,
        creator_id: payout.creator_id,
        source_funding_id: selectedFunding.id,
        source_charge_id: sourceChargeId,
        transfer_group:
          selectedFunding.stripe_transfer_group ?? `campaign_${payout.campaign_id}`,
        gross_amount: String(payout.amount),
        platform_fee_amount: String(payout.platform_fee_amount ?? 0),
        creator_amount: String(creatorTransferAmount),
      },
    });

    const { data: updatedPayout, error: updateError } = await supabase
      .from("campaign_payouts")
      .update({
        status: "paid",
        source_funding_id: selectedFunding.id,
        stripe_transfer_id: transfer.id,
        stripe_account_id: creatorProfile.stripe_account_id,
        stripe_source_charge_id: sourceChargeId,
        stripe_transfer_group:
          selectedFunding.stripe_transfer_group ?? `campaign_${payout.campaign_id}`,
        reversed_amount: 0,
        failure_reason: null,
        paid_at: new Date().toISOString(),
        reversed_at: null,
      })
      .eq("id", payout.id)
      .select(PAYOUT_SELECT)
      .single();

    if (updateError || !updatedPayout) {
      return NextResponse.json(
        { error: updateError?.message ?? "Unable to record released payout." },
        { status: 400 },
      );
    }

    return NextResponse.json({ payout: updatedPayout });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Unable to release payout.";

    const { data: failedPayout } = await supabase
      .from("campaign_payouts")
      .update({
        status: "failed",
        failure_reason: reason,
      })
      .eq("id", payout.id)
      .select(PAYOUT_SELECT)
      .single();

    return NextResponse.json(
      {
        error: reason,
        payout: failedPayout ?? null,
      },
      { status: 400 },
    );
  }
}
