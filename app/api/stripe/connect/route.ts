import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeServerClient } from "@/lib/stripe/server";

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
    .select("id, role, stripe_account_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "creator") {
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

  let stripeAccountId = profile.stripe_account_id;

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      metadata: {
        user_id: profile.id,
      },
    });

    stripeAccountId = account.id;

    await supabase
      .from("users")
      .update({ stripe_account_id: stripeAccountId })
      .eq("id", profile.id);
  }

  const origin = new URL(request.url).origin;
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${origin}/dashboard?stripe=refresh`,
    return_url: `${origin}/dashboard?stripe=connected`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
