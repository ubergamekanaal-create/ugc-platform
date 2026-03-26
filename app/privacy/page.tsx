import { SimplePage } from "@/components/marketing/simple-page";

export default function PrivacyPage() {
  return (
    <SimplePage
      eyebrow="Privacy"
      title="Privacy overview"
      intro="Replace this starter copy with your legal team's approved policy before production deployment."
    >
      <section>
        <h2 className="text-2xl font-semibold text-white">Data handling</h2>
        <p className="mt-3">
          Account data, campaign metadata, and application records are intended to
          live in Supabase with row-level security policies controlling access.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-semibold text-white">Payments</h2>
        <p className="mt-3">
          Stripe payment and payout onboarding flows are initiated from API routes,
          but sensitive payment information remains with Stripe.
        </p>
      </section>
    </SimplePage>
  );
}
