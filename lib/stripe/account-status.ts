import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

export type StripeAccountState = {
  stripe_account_id: string;
  stripe_onboarding_complete: boolean;
  stripe_details_submitted: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_transfers_enabled: boolean;
  stripe_onboarding_updated_at: string;
};

export function deriveStripeAccountState(account: Stripe.Account): StripeAccountState {
  const stripe_details_submitted = Boolean(account.details_submitted);
  const stripe_charges_enabled = Boolean(account.charges_enabled);
  const stripe_payouts_enabled = Boolean(account.payouts_enabled);
  const stripe_transfers_enabled = account.capabilities?.transfers === "active";

  return {
    stripe_account_id: account.id,
    stripe_onboarding_complete:
      stripe_details_submitted &&
      stripe_payouts_enabled &&
      stripe_transfers_enabled,
    stripe_details_submitted,
    stripe_charges_enabled,
    stripe_payouts_enabled,
    stripe_transfers_enabled,
    stripe_onboarding_updated_at: new Date().toISOString(),
  };
}

export async function syncStripeAccountForUser(
  admin: AdminClient,
  userId: string,
  account: Stripe.Account,
) {
  const state = deriveStripeAccountState(account);
  const { error } = await admin.from("users").update(state).eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return state;
}

export async function syncStripeAccountByAccountId(
  admin: AdminClient,
  account: Stripe.Account,
) {
  const state = deriveStripeAccountState(account);
  const { data, error } = await admin
    .from("users")
    .update(state)
    .eq("stripe_account_id", account.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    state,
    userId: data?.id ?? null,
  };
}
