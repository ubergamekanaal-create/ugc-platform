import { SimplePage } from "@/components/marketing/simple-page";

export default function ContactPage() {
  return (
    <SimplePage
      eyebrow="Contact"
      title="Talk to the platform team"
      intro="Use this route as the starting point for product support, implementation questions, or partnership outreach."
    >
      <section>
        <h2 className="text-2xl font-semibold text-white">Support</h2>
        <p className="mt-3">
          For onboarding, billing, or dashboard questions, route inquiries through
          your support workflow or replace this content with a live contact form.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-semibold text-white">Implementation</h2>
        <p className="mt-3">
          This page is ready for your CRM embed, support widget, or sales
          qualification flow once you connect the rest of the stack.
        </p>
      </section>
    </SimplePage>
  );
}
