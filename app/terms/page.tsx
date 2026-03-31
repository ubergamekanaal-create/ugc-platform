import { SimplePage } from "@/components/marketing/simple-page";

export default function TermsPage() {
  return (
    <SimplePage
      eyebrow="Terms"
      title="Platform terms"
      intro="This route is a placeholder for the contractual terms that govern platform usage for brands, creators, and administrators."
    >
      <section>
        <h2 className="text-2xl font-semibold text-white">Usage</h2>
        <p className="mt-3">
          Define how campaigns, creator submissions, content rights, and payout
          obligations work across both sides of the marketplace.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-semibold text-white">Billing and payouts</h2>
        <p className="mt-3">
          Clarify payment timing, refund expectations, dispute handling, and the
          role Stripe plays as the external payment processor.
        </p>
      </section>
    </SimplePage>
  );
}
