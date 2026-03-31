import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  FUNDING_SELECT,
  syncCampaignFundingFromCheckoutSession,
} from "@/lib/stripe/funding-sync";
import { getStripeServerClient } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

type ConfirmCheckoutBody = {
  sessionId?: string;
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
      { error: "Only brand accounts can confirm checkout sessions." },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as ConfirmCheckoutBody | null;
  const sessionId = body?.sessionId?.trim();

  if (!sessionId) {
    return NextResponse.json(
      { error: "A Stripe session id is required." },
      { status: 400 },
    );
  }

  const stripe = getStripeServerClient();
  const admin = createAdminClient();

  if (!stripe || !admin) {
    return NextResponse.json(
      {
        error: !stripe
          ? "Missing STRIPE_SECRET_KEY."
          : "Missing SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const { data: funding, error: fundingLookupError } = await supabase
    .from("campaign_fundings")
    .select(FUNDING_SELECT)
    .eq("brand_id", profile.id)
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (fundingLookupError) {
    return NextResponse.json(
      { error: fundingLookupError.message },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const syncedFunding = await syncCampaignFundingFromCheckoutSession(
      admin,
      stripe,
      session,
      session.status === "expired" ? "checkout.session.expired" : undefined,
    );

    if (syncedFunding.brand_id !== profile.id) {
      return NextResponse.json({ error: "Funding not found." }, { status: 404 });
    }

    return NextResponse.json({ funding: syncedFunding });
  } catch (error) {
    if (funding) {
      return NextResponse.json({ funding });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to confirm Stripe payment.",
      },
      { status: 400 },
    );
  }
}
