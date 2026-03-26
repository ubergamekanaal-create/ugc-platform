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
      title = campaign.title;
      amount = Number(campaign.budget);
    }
  }

  const resolvedTitle = title || "Campaign wallet top-up";
  const resolvedAmount = Math.max(100, Math.round(amount || 1000));
  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/dashboard?payment=success`,
    cancel_url: `${origin}/dashboard?payment=cancelled`,
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
    metadata: {
      brand_id: profile.id,
      campaign_id: body.campaignId ?? "",
    },
  });

  return NextResponse.json({ url: session.url });
}
