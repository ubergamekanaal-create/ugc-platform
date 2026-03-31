import { ReactNode } from "react";
import Link from "next/link";
import { BackgroundOrbs } from "@/components/shared/background-orbs";
import { BrandMark } from "@/components/shared/brand-mark";
import { FadeIn, PageTransition } from "@/components/shared/motion";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  asideTitle: string;
  asideText: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  asideTitle,
  asideText,
  children,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen bg-background">
      <BackgroundOrbs />
      <div className="relative z-10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
          <BrandMark />
          <Link
            href="/"
            className="text-sm text-muted transition hover:text-white"
          >
            Back to home
          </Link>
        </div>
        <PageTransition>
          <main className="mx-auto grid min-h-[calc(100vh-92px)] w-full max-w-7xl items-center gap-8 px-5 pb-12 pt-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-16">
            <FadeIn className="rounded-[2.5rem] border border-white/8 bg-white/[0.03] p-8 shadow-panel sm:p-10">
              <p className="text-sm uppercase tracking-[0.24em] text-accent/80">
                {eyebrow}
              </p>
              <h1 className="mt-4 font-display text-4xl tracking-tight text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
                {description}
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  ["Role-based access", "Brand and creator dashboards"],
                  ["Campaign workflows", "Post, apply, review, and move fast"],
                ].map(([label, hint]) => (
                  <div
                    key={label}
                    className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5"
                  >
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="mt-2 text-sm text-muted">{hint}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
            <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <FadeIn
                delay={0.08}
                className="order-2 rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,_rgba(255,255,255,0.05),_rgba(255,255,255,0.02))] p-6 shadow-panel lg:order-1"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-success/80">
                  Platform preview
                </p>
                <h2 className="mt-4 text-2xl font-semibold text-white">
                  {asideTitle}
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {asideText}
                </p>
                <div className="mt-8 space-y-3">
                  {[
                    "Campaign posting and structured applications",
                    "Creator payout setup through Stripe Connect",
                    "Responsive layouts with polished motion",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </FadeIn>
              <FadeIn delay={0.12} className="order-1 lg:order-2">
                {children}
              </FadeIn>
            </div>
          </main>
        </PageTransition>
      </div>
    </div>
  );
}
