import { ReactNode } from "react";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { BackgroundOrbs } from "@/components/shared/background-orbs";
import { FadeIn, PageTransition } from "@/components/shared/motion";

type SimplePageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export function SimplePage({
  eyebrow,
  title,
  intro,
  children,
}: SimplePageProps) {
  return (
    <div className="relative min-h-screen bg-[#f8fbff] text-slate-950">
      <BackgroundOrbs tone="light" />
      <div className="relative z-10">
        <MarketingNavbar />
        <PageTransition>
          <main className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
            <FadeIn className="rounded-[2.5rem] border border-slate-200/80 bg-white/90 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-10 lg:p-12">
              <p className="text-sm uppercase tracking-[0.24em] text-accent/80">
                {eyebrow}
              </p>
              <h1 className="mt-4 font-display text-4xl tracking-tight text-slate-950 sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
                {intro}
              </p>
              <div className="mt-10 space-y-8 text-sm leading-8 text-slate-700">
                {children}
              </div>
            </FadeIn>
          </main>
        </PageTransition>
        <MarketingFooter />
      </div>
    </div>
  );
}
