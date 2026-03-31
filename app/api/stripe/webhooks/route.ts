import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncStripeAccountByAccountId } from "@/lib/stripe/account-status";
import { syncCampaignFundingFromCheckoutSession } from "@/lib/stripe/funding-sync";
import { syncCampaignPayoutFromTransfer } from "@/lib/stripe/payout-sync";
import { getStripeServerClient } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getWebhookSecrets() {
  return [
    process.env.STRIPE_WEBHOOK_SECRET ?? null,
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET ?? null,
  ].filter((secret): secret is string => Boolean(secret));
}

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  const admin = createAdminClient();
  const webhookSecrets = getWebhookSecrets();
  const signature = request.headers.get("stripe-signature");

  if (!stripe) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY." },
      { status: 503 },
    );
  }

  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  if (!webhookSecrets.length) {
    return NextResponse.json(
      {
        error:
          "Missing STRIPE_WEBHOOK_SECRET or STRIPE_CONNECT_WEBHOOK_SECRET.",
      },
      { status: 503 },
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature header." },
      { status: 400 },
    );
  }

  const payload = await request.text();
  let event: Stripe.Event | null = null;
  let signatureError: Error | null = null;

  for (const secret of webhookSecrets) {
    try {
      event = stripe.webhooks.constructEvent(payload, signature, secret);
      signatureError = null;
      break;
    } catch (error) {
      signatureError =
        error instanceof Error
          ? error
          : new Error("Unable to verify Stripe webhook signature.");
    }
  }

  if (!event) {
    return NextResponse.json(
      {
        error:
          signatureError?.message ?? "Unable to verify Stripe webhook signature.",
      },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        await syncCampaignFundingFromCheckoutSession(
          admin,
          stripe,
          event.data.object as Stripe.Checkout.Session,
          event.type,
        );
        break;
      case "account.updated":
        await syncStripeAccountByAccountId(
          admin,
          event.data.object as Stripe.Account,
        );
        break;
      case "transfer.created":
      case "transfer.updated":
      case "transfer.reversed":
        await syncCampaignPayoutFromTransfer(
          admin,
          event.data.object as Stripe.Transfer,
        );
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("stripe webhook processing failed", {
      eventType: event?.type,
      error,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process Stripe webhook event.",
      },
      { status: 500 },
    );
  }
}
