"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { HoverLift, PageTransition } from "@/components/shared/motion";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import type { DashboardMetric, Role, UserProfile } from "@/lib/types";
import { getDisplayName, getInitials } from "@/lib/utils";

type DashboardShellProps = {
  role: Role;
  profile: UserProfile;
  title: string;
  description: string;
  metrics: DashboardMetric[];
  children: React.ReactNode;
};

const navigationByRole: Record<Role, Array<{ href: string; label: string }>> = {
  brand: [
    { href: "#overview", label: "Overview" },
    { href: "#post-campaign", label: "Post campaign" },
    { href: "#applications", label: "Applications" },
    { href: "#payments", label: "Payments" },
    { href: "#settings", label: "Settings" },
  ],
  creator: [
    { href: "#overview", label: "Overview" },
    { href: "#marketplace", label: "Marketplace" },
    { href: "#applications", label: "Applications" },
    { href: "#earnings", label: "Earnings" },
    { href: "#settings", label: "Settings" },
  ],
};

export function DashboardShell({
  role,
  profile,
  title,
  description,
  metrics,
  children,
}: DashboardShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const displayName =
    role === "brand"
      ? getDisplayName(profile.company_name, "Brand team")
      : getDisplayName(profile.full_name, "Creator");

  return (
    <PageTransition className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-5 py-5 sm:px-6 lg:flex-row lg:px-8">
      <aside className="w-full shrink-0 rounded-[2rem] border border-white/8 bg-white/[0.03] p-5 shadow-panel lg:sticky lg:top-5 lg:w-[300px] lg:self-start">
        <div className="flex items-center justify-between gap-4 lg:block">
          <BrandMark href="/" />
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white lg:hidden"
          >
            Menu
          </button>
        </div>
        <div className="mt-6 flex items-center gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_rgba(7,107,210,0.28),_rgba(59,130,246,0.28))] text-sm font-semibold text-white">
            {getInitials(displayName)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{displayName}</p>
            <p className="text-sm text-muted">
              {role === "brand" ? "Brand workspace" : "Creator workspace"}
            </p>
          </div>
        </div>
        <nav
          className={`mt-6 space-y-2 ${isOpen ? "block" : "hidden"} lg:block`}
        >
          {navigationByRole[role].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl border border-transparent px-4 py-3 text-sm text-muted transition hover:border-accent/15 hover:bg-white/[0.04] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-accent/80">
            Live role
          </p>
          <p className="mt-3 text-lg font-semibold text-white">
            {role === "brand" ? "Brand dashboard" : "Creator dashboard"}
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Real Supabase-backed data loads here when your schema is applied.
          </p>
        </div>
      </aside>

      <main className="flex-1 space-y-6">
        <section
          id="overview"
          className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 shadow-panel sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.24em] text-accent/80">
                Dashboard
              </p>
              <h1 className="mt-4 font-display text-4xl tracking-tight text-white">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                {description}
              </p>
            </div>
            <SignOutButton />
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <HoverLift
                key={metric.label}
                className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5"
              >
                <p className="text-sm text-muted">{metric.label}</p>
                <div className="mt-3 text-3xl font-semibold text-white">
                  {metric.value}
                </div>
                <p className="mt-2 text-sm text-slate-300">{metric.hint}</p>
              </HoverLift>
            ))}
          </div>
        </section>
        {children}
      </main>
    </PageTransition>
  );
}
