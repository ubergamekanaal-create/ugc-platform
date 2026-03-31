import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeServerClient } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

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
      { error: "Only brand accounts can create checkout sessions." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    campaignId?: string | null;
    title?: string | null;
    amount?: number | string | null;
  };

  const stripe = getStripeServerClient();

  if (!stripe) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY." },
      { status: 503 },
    );
  }

  let resolvedCampaignId: string | null = null;
  let title = typeof body.title === "string" ? body.title.trim() : "";
  let amount =
    typeof body.amount === "number"
      ? body.amount
      : Number(body.amount ?? 0);

  if (body.campaignId) {
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, title, budget")
      .eq("id", body.campaignId)
      .eq("brand_id", profile.id)
      .single();

    if (campaign) {
      resolvedCampaignId = campaign.id;
      title = campaign.title;
      amount = Number(campaign.budget);
    }
  }

  const resolvedTitle = title || "Campaign wallet top-up";
  const resolvedAmount = Math.max(100, Math.round(amount || 1000));
  const origin = new URL(request.url).origin;
  const transferGroup = resolvedCampaignId
    ? `campaign_${resolvedCampaignId}_${Date.now()}`
    : `wallet_${profile.id}_${Date.now()}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${origin}/dashboard/finance?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/finance?payment=cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: resolvedAmount * 100,
          product_data: {
            name: resolvedTitle,
          },
        },
      },
    ],
    payment_intent_data: {
      transfer_group: transferGroup,
    },
    metadata: {
      brand_id: profile.id,
      campaign_id: resolvedCampaignId ?? "",
      amount: String(resolvedAmount),
      transfer_group: transferGroup,
    },
  });

  const { error: fundingError } = await supabase.from("campaign_fundings").insert({
    campaign_id: resolvedCampaignId,
    brand_id: profile.id,
    stripe_checkout_session_id: session.id,
    stripe_transfer_group: transferGroup,
    amount: resolvedAmount,
    currency: "usd",
    status: "pending",
  });

  if (fundingError) {
    return NextResponse.json(
      { error: fundingError.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ url: session.url });
}
