import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-4">
          <BrandMark tone="light" />
          <p className="max-w-md text-sm text-slate-500">
            A polished creator-brand SaaS shell with role-based dashboards,
            campaign workflows, and payment integration entry points.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          <Link href="/about" className="transition hover:text-slate-950">
            About
          </Link>
          <Link href="/contact" className="transition hover:text-slate-950">
            Contact
          </Link>
          <Link href="/terms" className="transition hover:text-slate-950">
            Terms
          </Link>
          <Link href="/privacy" className="transition hover:text-slate-950">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
