import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

export const FUNDING_SELECT =
  "id, campaign_id, brand_id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_charge_id, stripe_transfer_group, amount, currency, status, created_at, paid_at";

export type StripeFundingRecord = {
  id: string;
  campaign_id: string | null;
  brand_id: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_transfer_group: string | null;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "cancelled" | "failed";
  created_at: string;
  paid_at: string | null;
};

function resolveFundingStatus(
  session: Stripe.Checkout.Session,
  eventType?: string,
) {
  if (eventType === "checkout.session.expired") {
    return "cancelled" as const;
  }

  if (eventType === "checkout.session.async_payment_failed") {
    return "failed" as const;
  }

  if (session.payment_status === "paid") {
    return "paid" as const;
  }

  if (session.status === "expired") {
    return "cancelled" as const;
  }

  return "pending" as const;
}

function resolveFundingAmount(session: Stripe.Checkout.Session) {
  if (typeof session.amount_total === "number") {
    return Math.max(session.amount_total / 100, 0);
  }

  return Math.max(Number(session.metadata?.amount ?? 0), 0);
}

async function resolvePaymentIntentFundingDetails(
  stripe: Stripe,
  paymentIntentId: string | null,
) {
  if (!paymentIntentId) {
    return {
      stripe_charge_id: null,
      stripe_transfer_group: null,
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });

    return {
      stripe_charge_id:
        typeof paymentIntent.latest_charge === "string"
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge?.id ?? null,
      stripe_transfer_group: paymentIntent.transfer_group ?? null,
    };
  } catch (error) {
    console.error("resolvePaymentIntentFundingDetails failed", {
      paymentIntentId,
      error,
    });

    return {
      stripe_charge_id: null,
      stripe_transfer_group: null,
    };
  }
}

export async function syncCampaignFundingFromCheckoutSession(
  admin: AdminClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  eventType?: string,
): Promise<StripeFundingRecord> {
  const nextStatus = resolveFundingStatus(session, eventType);
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  const paymentIntentDetails =
    nextStatus === "paid"
      ? await resolvePaymentIntentFundingDetails(stripe, paymentIntentId)
      : {
          stripe_charge_id: null,
          stripe_transfer_group: null,
        };

  const { data: existingFunding, error: lookupError } = await admin
    .from("campaign_fundings")
    .select(FUNDING_SELECT)
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  const paidAt =
    nextStatus === "paid"
      ? existingFunding?.paid_at ?? new Date().toISOString()
      : null;

  const payload = {
    stripe_payment_intent_id: paymentIntentId,
    stripe_charge_id:
      paymentIntentDetails.stripe_charge_id ??
      existingFunding?.stripe_charge_id ??
      null,
    stripe_transfer_group:
      paymentIntentDetails.stripe_transfer_group ??
      session.metadata?.transfer_group?.trim() ??
      existingFunding?.stripe_transfer_group ??
      null,
    amount: resolveFundingAmount(session),
    currency: session.currency ?? "usd",
    status: nextStatus,
    paid_at: paidAt,
  };

  if (existingFunding) {
    const { data: updatedFunding, error: updateError } = await admin
      .from("campaign_fundings")
      .update(payload)
      .eq("id", existingFunding.id)
      .select(FUNDING_SELECT)
      .single();

    if (updateError || !updatedFunding) {
      throw new Error(updateError?.message ?? "Unable to update campaign funding.");
    }

    return updatedFunding;
  }

  const brandId = session.metadata?.brand_id?.trim();
  const campaignId = session.metadata?.campaign_id?.trim() || null;

  if (!brandId) {
    throw new Error(
      `Unable to resolve the brand for Stripe checkout session ${session.id}.`,
    );
  }

  const { data: insertedFunding, error: insertError } = await admin
    .from("campaign_fundings")
    .insert({
      campaign_id: campaignId,
      brand_id: brandId,
      stripe_checkout_session_id: session.id,
      ...payload,
    })
    .select(FUNDING_SELECT)
    .single();

  if (insertError || !insertedFunding) {
    throw new Error(
      insertError?.message ?? "Unable to insert Stripe campaign funding.",
    );
  }

  return insertedFunding;
}

export async function hydrateFundingChargeDetails(
  admin: AdminClient,
  stripe: Stripe,
  funding: StripeFundingRecord,
): Promise<StripeFundingRecord> {
  if (funding.stripe_charge_id || !funding.stripe_checkout_session_id) {
    return funding;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(
      funding.stripe_checkout_session_id,
    );

    return await syncCampaignFundingFromCheckoutSession(admin, stripe, session);
  } catch (error) {
    console.error("hydrateFundingChargeDetails failed", {
      fundingId: funding.id,
      stripeCheckoutSessionId: funding.stripe_checkout_session_id,
      error,
    });

    return funding;
  }
}
