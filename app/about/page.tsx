import { SimplePage } from "@/components/marketing/simple-page";

export default function AboutPage() {
  return (
    <SimplePage
      eyebrow="About"
      title="Built for the new creator-brand operating model"
      intro="CIRCL is designed as a polished SaaS foundation for teams that want campaign publishing, structured applications, and payment routing to feel cohesive from day one."
    >
      <section>
        <h2 className="text-2xl font-semibold text-white">What this app includes</h2>
        <p className="mt-3">
          The codebase ships with a marketing site, unified auth flows, a role-aware
          dashboard, Supabase-ready campaign tables, and Stripe entry points for
          brand checkout and creator payout setup.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-semibold text-white">Why the structure matters</h2>
        <p className="mt-3">
          The component layout is intentionally reusable so you can extend it into
          a real product instead of replacing a one-off mockup later.
        </p>
      </section>
    </SimplePage>
  );
}
