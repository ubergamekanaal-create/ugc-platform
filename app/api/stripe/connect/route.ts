import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncStripeAccountForUser } from "@/lib/stripe/account-status";
import { getStripeServerClient } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: rawProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (rawProfile?.role !== "creator") {
      return NextResponse.json(
        { error: "Only creator accounts can start payout onboarding." },
        { status: 403 },
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

    let stripeAccountId =
      typeof rawProfile?.stripe_account_id === "string"
        ? rawProfile.stripe_account_id
        : null;
    let account: Stripe.Account | null = null;

    if (!stripeAccountId) {
      account = await stripe.accounts.create({
        type: "express",
        metadata: {
          user_id: rawProfile.id,
        },
      });

      stripeAccountId = account.id;
    } else {
      account = await stripe.accounts.retrieve(stripeAccountId);
    }

    if (!account) {
      throw new Error("Unable to resolve the Stripe connected account.");
    }

    const state = await syncStripeAccountForUser(admin, rawProfile.id, account);

    if (state.stripe_onboarding_complete && account.type === "express") {
      const loginLink = await stripe.accounts.createLoginLink(account.id);

      return NextResponse.json({
        url: loginLink.url,
        mode: "dashboard",
        state,
      });
    }

    const origin = new URL(request.url).origin;
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/dashboard/payouts?stripe=refresh`,
      return_url: `${origin}/dashboard/payouts?stripe=connected`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      mode: "onboarding",
      state,
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      const normalizedMessage = error.message.toLowerCase();

      if (normalizedMessage.includes("signed up for connect")) {
        return NextResponse.json(
          {
            error:
              "Stripe Connect is not enabled for this Stripe account yet. Complete your platform's Connect registration in the Stripe Dashboard, then try again.",
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start Stripe payout onboarding.",
      },
      { status: 400 },
    );
  }
}
