import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { BrandMark } from "@/components/shared/brand-mark";
import { FadeIn, PageTransition } from "@/components/shared/motion";
import type { Role } from "@/lib/types";

type SignupPageProps = {
  searchParams?: {
    role?: string;
  };
};

function resolveRole(role?: string): Role {
  return role === "brand" ? "brand" : "creator";
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  const initialRole = resolveRole(searchParams?.role);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f8fc] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(7,107,210,0.14),_transparent_28%),radial-gradient(circle_at_84%_18%,_rgba(59,130,246,0.12),_transparent_18%),linear-gradient(180deg,_#ffffff,_#f5f8fc_45%,_#eef4fb_100%)]" />
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <BrandMark tone="light" />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-slate-500 transition hover:text-slate-900"
            >
              Back to home
            </Link>
            <Link
              href={`/login?role=${initialRole}`}
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 px-4 text-sm font-medium text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:border-accent/20 hover:text-accent"
            >
              Sign in
            </Link>
          </div>
        </div>

        <PageTransition className="mx-auto flex w-full max-w-6xl flex-1 items-center py-8">
          <div className="grid w-full gap-8 lg:grid-cols-[1.02fr_0.98fr] xl:gap-12">
            <FadeIn className="order-2 lg:order-1">
              <div className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.26em] text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur">
                Signup
              </div>
              <h1 className="mt-8 max-w-3xl font-display text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
                Create your creator or brand account
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Choose the role that matches your workflow and start in the right
                CIRCL experience from day one.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Role-aware onboarding",
                    hint: "Brand and creator workflows start from the correct dashboard.",
                  },
                  {
                    label: "Operational structure",
                    hint: "Campaigns, approvals, and payouts follow one connected flow.",
                  },
                  {
                    label: "Clean handoff",
                    hint: "Supabase account creation and profile provisioning happen together.",
                  },
                ].map((item, index) => (
                  <FadeIn
                    key={item.label}
                    delay={0.06 * (index + 1)}
                    className="rounded-[1.75rem] border border-white/80 bg-white/82 p-5 shadow-[0_22px_55px_rgba(15,23,42,0.06)] backdrop-blur"
                  >
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-500">{item.hint}</p>
                  </FadeIn>
                ))}
              </div>

              <FadeIn
                delay={0.16}
                className="mt-10 overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,_rgba(231,242,255,0.94),_rgba(255,255,255,0.96))] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:p-8"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                      Set up once, scale the workflow
                    </p>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                      Professional onboarding for both sides of the marketplace
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                      Signup stores role metadata for Supabase profile provisioning,
                      then routes each account into the workspace built for that role.
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                    Takes about 2 minutes
                  </span>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    "Create the account and assign the correct role.",
                    "Provision the profile details used by the dashboard.",
                    "Route into the workspace built for brands or creators.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 text-sm leading-7 text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </FadeIn>
            </FadeIn>

            <FadeIn delay={0.1} className="order-1 lg:order-2">
              <SignupForm initialRole={initialRole} />
            </FadeIn>
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
