// "use client"
// import Link from "next/link";
// import { MarketingFooter } from "@/components/marketing/footer";
// import { MarketingNavbar } from "@/components/marketing/navbar";
// import { BackgroundOrbs } from "@/components/shared/background-orbs";
// import { FadeIn, HoverLift, PageTransition } from "@/components/shared/motion";
// import {
//   featureCards,
//   howItWorksSteps,
//   logoCloud,
//   pricingPlans,
//   testimonials,
// } from "@/lib/content";

// export function HomePage() {
//   return (
//     <div className="relative min-h-screen bg-[#f8fbff] text-slate-950">
//       <BackgroundOrbs tone="light" />
//       <div className="relative z-10">
//         <MarketingNavbar />
//         <PageTransition>
//           <main>
// <section className="mx-auto grid w-full max-w-7xl gap-12 px-5 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-24 lg:pt-24">
//   <FadeIn className="space-y-8">
//     <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-accent/80">
//       Creator commerce, rebuilt
//     </div>
//     <div className="space-y-6">
//       {/* <h1 className="max-w-3xl font-display text-5xl leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
//         Connect creators with brands and monetize your content
//       </h1> */}
//       <h1 className="max-w-3xl font-display text-5xl leading-[0.95] tracking-tighter sm:text-6xl lg:text-6xl">
//         Your creator campaign command center where brands scale and creators earn
//         <br />
//         {/* <span className="text-blue-600">

//         </span> */}
//       </h1>
//       <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
//         CIRCL brings brands and creators together in one seamless platform — enabling brands to launch and scale campaigns, while creators collaborate, get approved, and earn from their content, all in a single workflow.
//       </p>
//     </div>
//     <div className="flex flex-col gap-3 sm:flex-row">
//       <Link
//         href="/signup"
//         className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-6 py-3 text-sm font-semibold text-white transition hover:shadow-glow"
//       >
//         Get Started
//       </Link>
//       <Link
//         href="/login"
//         className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent/30 hover:bg-blue-50"
//       >
//         Login
//       </Link>
//     </div>
//     <div className="grid gap-4 sm:grid-cols-3">
//       {[
//         ["$380K", "creator payouts processed"],
//         ["82%", "repeat campaign rate"],
//         ["5.2x", "faster campaign turnaround"],
//       ].map(([value, label]) => (
//         <div
//           key={label}
//           className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
//         >
//           <div className="text-2xl font-semibold text-slate-950">
//             {value}
//           </div>
//           <div className="mt-2 text-sm text-slate-500">{label}</div>
//         </div>
//       ))}
//     </div>
//   </FadeIn>
//   <FadeIn delay={0.1} className="relative">
//     <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(244,248,252,0.92))] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-6">
//       <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(7,107,210,0.16),_transparent_65%)]" />
//       <div className="relative space-y-4">
//         <div className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4">
//           <div>
//             <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
//               Live campaign
//             </p>
//             <h2 className="mt-2 text-xl font-semibold text-slate-950">
//               Creator launch board
//             </h2>
//           </div>
//           <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
//             24 applications
//           </div>
//         </div>
//         <div className="grid gap-4 sm:grid-cols-2">
//           <HoverLift className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
//             <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
//               Brand overview
//             </p>
//             <div className="mt-4 text-3xl font-semibold text-slate-950">
//               12
//             </div>
//             <p className="mt-2 text-sm text-slate-600">
//               active creator conversations this week
//             </p>
//           </HoverLift>
//           <HoverLift className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
//             <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
//               Creator earnings
//             </p>
//             <div className="mt-4 text-3xl font-semibold text-slate-950">
//               $8.4K
//             </div>
//             <p className="mt-2 text-sm text-slate-600">
//               projected payouts across accepted briefs
//             </p>
//           </HoverLift>
//         </div>
//         <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
//           <div className="flex flex-wrap items-center justify-between gap-3">
//             <div>
//               <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
//                 Campaign pipeline
//               </p>
//               <h3 className="mt-2 text-lg font-semibold text-slate-950">
//                 Short-form skincare drop
//               </h3>
//             </div>
//             <div className="text-sm font-medium text-accent">Budget: $4,500</div>
//           </div>
//           <div className="mt-5 space-y-3">
//             {[
//               ["Applications", "24"],
//               ["Shortlisted", "7"],
//               ["Approved", "3"],
//             ].map(([label, value]) => (
//               <div key={label} className="space-y-2">
//                 <div className="flex items-center justify-between text-sm text-slate-600">
//                   <span>{label}</span>
//                   <span>{value}</span>
//                 </div>
//                 <div className="h-2 rounded-full bg-slate-100">
//                   <div className="h-full rounded-full bg-[linear-gradient(90deg,_#076BD2,_#3B82F6)]" style={{ width: label === "Applications" ? "92%" : label === "Shortlisted" ? "58%" : "34%" }} />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   </FadeIn>
// </section>

//             <section className="border-y border-slate-200/80 bg-white/55">
//               <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 py-8 text-center text-sm text-slate-500 sm:grid-cols-3 lg:grid-cols-6 lg:px-8">
//                 {logoCloud.map((logo) => (
//                   <span key={logo} className="font-medium tracking-[0.18em] text-slate-500">
//                     {logo}
//                   </span>
//                 ))}
//               </div>
//             </section>

//             <section
//               id="how-it-works"
//               className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 lg:px-8"
//             >
//               <FadeIn className="max-w-2xl">
//                 <p className="text-sm uppercase tracking-[0.24em] text-accent/80">
//                   How it works
//                 </p>
//                 <h2 className="mt-4 font-display text-4xl tracking-tight text-slate-950">
//                   A fast path from onboarding to paid collaboration
//                 </h2>
//               </FadeIn>
//               <div className="mt-12 grid gap-5 lg:grid-cols-3">
//                 {howItWorksSteps.map((step, index) => (
//                   <HoverLift
//                     key={step.title}
//                     className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
//                   >
//                     <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-sm font-semibold text-accent/90">
//                       0{index + 1}
//                     </div>
//                     <h3 className="mt-6 text-2xl font-semibold text-slate-950">
//                       {step.title}
//                     </h3>
//                     <p className="mt-4 text-sm leading-7 text-slate-600">
//                       {step.description}
//                     </p>
//                   </HoverLift>
//                 ))}
//               </div>
//             </section>

//             <section
//               id="features"
//               className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 lg:px-8"
//             >
//               <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
//                 <FadeIn className="space-y-5">
//                   <p className="text-sm uppercase tracking-[0.24em] text-success/80">
//                     Why teams switch
//                   </p>
//                   <h2 className="font-display text-4xl tracking-tight text-slate-950">
//                     Operational clarity for creator programs that need to move
//                   </h2>
//                   <p className="max-w-xl text-base leading-8 text-slate-600">
//                     The UI mirrors a high-end startup product: bold hero, crisp
//                     spacing, clear sections, and workflow-focused dashboards that
//                     scale beyond a static mockup.
//                   </p>
//                 </FadeIn>
//                 <div className="grid gap-5">
//                   {featureCards.map((feature) => (
//                     <HoverLift
//                       key={feature.title}
//                       className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
//                     >
//                       <p className="text-xs uppercase tracking-[0.24em] text-accent/80">
//                         {feature.eyebrow}
//                       </p>
//                       <h3 className="mt-3 text-2xl font-semibold text-slate-950">
//                         {feature.title}
//                       </h3>
//                       <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
//                         {feature.description}
//                       </p>
//                     </HoverLift>
//                   ))}
//                 </div>
//               </div>
//             </section>

//             <section
//               id="testimonials"
//               className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 lg:px-8"
//             >
//               <FadeIn className="max-w-2xl">
//                 <p className="text-sm uppercase tracking-[0.24em] text-accent/80">
//                   Social proof
//                 </p>
//                 <h2 className="mt-4 font-display text-4xl tracking-tight text-slate-950">
//                   Trusted by teams building repeatable UGC engines
//                 </h2>
//               </FadeIn>
//               <div className="mt-12 grid gap-5 lg:grid-cols-3">
//                 {testimonials.map((testimonial) => (
//                   <HoverLift
//                     key={testimonial.author}
//                     className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
//                   >
//                     <p className="text-base leading-8 text-slate-700">
//                       “{testimonial.quote}”
//                     </p>
//                     <div className="mt-8">
//                       <p className="font-semibold text-slate-950">
//                         {testimonial.author}
//                       </p>
//                       <p className="text-sm text-slate-500">{testimonial.role}</p>
//                     </div>
//                   </HoverLift>
//                 ))}
//               </div>
//             </section>

//             <section
//               id="pricing"
//               className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-6 lg:px-8"
//             >
//               <FadeIn className="max-w-2xl">
//                 <p className="text-sm uppercase tracking-[0.24em] text-success/80">
//                   Pricing
//                 </p>
//                 <h2 className="mt-4 font-display text-4xl tracking-tight text-slate-950">
//                   Start free, scale into a full operating system
//                 </h2>
//               </FadeIn>
//               <div className="mt-12 grid gap-5 lg:grid-cols-3">
//                 {pricingPlans.map((plan, index) => (
//                   <HoverLift
//                     key={plan.name}
//                     className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
//                   >
//                     <div className="flex items-center justify-between">
//                       <h3 className="text-2xl font-semibold text-slate-950">
//                         {plan.name}
//                       </h3>
//                       {index === 1 ? (
//                         <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent/90">
//                           Popular
//                         </span>
//                       ) : null}
//                     </div>
//                     <div className="mt-6 text-4xl font-semibold text-slate-950">
//                       {plan.price}
//                     </div>
//                     <p className="mt-4 text-sm leading-7 text-slate-600">
//                       {plan.description}
//                     </p>
//                     <div className="mt-6 space-y-3 text-sm text-slate-700">
//                       {plan.points.map((point) => (
//                         <div key={point} className="flex gap-3">
//                           <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
//                           <span>{point}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </HoverLift>
//                 ))}
//               </div>
//             </section>

//             <section className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-6 lg:px-8">
//               <FadeIn className="rounded-[2.5rem] border border-slate-200/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(239,246,255,0.96))] p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-10 lg:p-12">
//                 <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
//                   <div className="max-w-2xl">
//                     <p className="text-sm uppercase tracking-[0.24em] text-accent/80">
//                       Start now
//                     </p>
//                     <h2 className="mt-4 font-display text-4xl tracking-tight text-slate-950">
//                       Launch a creator marketplace your team can actually operate
//                     </h2>
//                     <p className="mt-4 text-base leading-8 text-slate-600">
//                       Built for CIRCL with Next.js App Router, Tailwind CSS,
//                       Framer Motion, Supabase, and Stripe-ready scaffolding.
//                     </p>
//                   </div>
//                   <div className="flex flex-col gap-3 sm:flex-row">
//                     <Link
//                       href="/signup"
//                       className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-6 py-3 text-sm font-semibold text-white"
//                     >
//                       Create an account
//                     </Link>
//                     <Link
//                       href="/dashboard"
//                       className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent/30 hover:bg-blue-50"
//                     >
//                       Explore dashboard
//                     </Link>
//                   </div>
//                 </div>
//               </FadeIn>
//             </section>
//           </main>
//         </PageTransition>
//         <MarketingFooter />
//       </div>
//     </div>
//   );
// }




"use client";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { BackgroundOrbs } from "@/components/shared/background-orbs";
import { FadeIn, HoverLift, PageTransition } from "@/components/shared/motion";
import {
  featureCards,
  howItWorksSteps,
  logoCloud,
  pricingPlans,
  testimonials,
} from "@/lib/content";

type HomePageProps = {
  isLoggedIn?: boolean;
};

export function HomePage({ isLoggedIn = false }: HomePageProps) {
  return (
    <div className="relative min-h-screen bg-[#f8fbff] text-slate-950">
      <BackgroundOrbs tone="light" />

      <div className="relative z-10">
        <MarketingNavbar isLoggedIn={isLoggedIn} />

        <PageTransition>
          <main>

            <section className="mx-auto grid w-full max-w-7xl gap-12 px-5 pb-16 pt-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:pb-24 lg:pt-24">
              <FadeIn className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-accent/80">
                  Creator commerce, rebuilt
                </div>
                <div className="space-y-6">
                  {/* <h1 className="max-w-3xl font-display text-5xl leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                    Connect creators with brands and monetize your content
                  </h1> */}
                  <h1 className="max-w-3xl font-display text-5xl leading-[0.95] tracking-tighter sm:text-6xl lg:text-6xl">
                    Your creator campaign command center where brands scale and creators earn
                    <br />
                    {/* <span className="text-blue-600">
                      
                    </span> */}
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                    CIRCL brings brands and creators together in one seamless platform — enabling brands to launch and scale campaigns, while creators collaborate, get approved, and earn from their content, all in a single workflow.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {isLoggedIn ? (
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-6 py-3 text-sm font-semibold text-white transition hover:shadow-glow"
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/signup"
                        className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-6 py-3 text-sm font-semibold text-white transition hover:shadow-glow"
                      >
                        Get Started
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent/30 hover:bg-blue-50"
                      >
                        Login
                      </Link>
                    </>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    ["$380K", "creator payouts processed"],
                    ["82%", "repeat campaign rate"],
                    ["5.2x", "faster campaign turnaround"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
                    >
                      <div className="text-2xl font-semibold text-slate-950">
                        {value}
                      </div>
                      <div className="mt-2 text-sm text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              </FadeIn>
              <FadeIn delay={0.1} className="relative">
                <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(244,248,252,0.92))] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-6">
                  <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(7,107,210,0.16),_transparent_65%)]" />
                  <div className="relative space-y-4">
                    <div className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Live campaign
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-950">
                          Creator launch board
                        </h2>
                      </div>
                      <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        24 applications
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <HoverLift className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Brand overview
                        </p>
                        <div className="mt-4 text-3xl font-semibold text-slate-950">
                          12
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          active creator conversations this week
                        </p>
                      </HoverLift>
                      <HoverLift className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Creator earnings
                        </p>
                        <div className="mt-4 text-3xl font-semibold text-slate-950">
                          $8.4K
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          projected payouts across accepted briefs
                        </p>
                      </HoverLift>
                    </div>
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            Campaign pipeline
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-slate-950">
                            Short-form skincare drop
                          </h3>
                        </div>
                        <div className="text-sm font-medium text-accent">Budget: $4,500</div>
                      </div>
                      <div className="mt-5 space-y-3">
                        {[
                          ["Applications", "24"],
                          ["Shortlisted", "7"],
                          ["Approved", "3"],
                        ].map(([label, value]) => (
                          <div key={label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-slate-600">
                              <span>{label}</span>
                              <span>{value}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-[linear-gradient(90deg,_#076BD2,_#3B82F6)]" style={{ width: label === "Applications" ? "92%" : label === "Shortlisted" ? "58%" : "34%" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </section>
            {/* <section className="border-y border-slate-200/70 bg-white/70 backdrop-blur">
              <div className="mx-auto max-w-7xl px-6 py-10">
                <FadeIn>
                  <p className="text-center text-xs uppercase tracking-[0.3em] text-slate-400">
                    Trusted by modern teams
                  </p>
                </FadeIn>

                <div className="mt-8 grid grid-cols-2 gap-6 text-center sm:grid-cols-3 lg:grid-cols-6">
                  {logoCloud.map((logo) => (
                    <HoverLift
                      key={logo}
                      className="rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm hover:shadow-md"
                    >
                      {logo}
                    </HoverLift>
                  ))}
                </div>
              </div>
            </section> */}

            <section className="mx-auto max-w-7xl px-6 py-24" id="how-it-works">
              <FadeIn className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.3em] text-accent/80">
                  How it works
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                  From signup to first payout — simplified
                </h2>
              </FadeIn>

              <div className="mt-16 grid gap-10 lg:grid-cols-3">
                {howItWorksSteps.map((step, index) => (
                  <FadeIn key={step.title} delay={index * 0.1}>
                    <div className="h-[100%] relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition">

                      <div className="absolute -top-5 left-6 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-400 text-white text-sm font-semibold">
                        {index + 1}
                      </div>

                      <h3 className="mt-6 text-xl font-semibold">
                        {step.title}
                      </h3>

                      <p className="mt-3 text-sm text-slate-600 leading-7">
                        {step.description}
                      </p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </section>

            <section className="bg-gradient-to-b from-white to-blue-50/40 py-24" id="features">
              <div className="mx-auto max-w-7xl px-6">

                <FadeIn className="max-w-2xl">
                  <p className="text-sm uppercase tracking-[0.3em] text-blue-500">
                    Platform capabilities
                  </p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                    Everything you need to scale creator campaigns
                  </h2>
                </FadeIn>

                <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featureCards.map((feature, index) => (
                    <FadeIn key={feature.title} delay={index * 0.05}>
                      <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl transition">

                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-blue-50 to-transparent" />

                        <p className="text-xs uppercase tracking-[0.3em] text-blue-500 relative z-10">
                          {feature.eyebrow}
                        </p>

                        <h3 className="mt-3 text-xl font-semibold relative z-10">
                          {feature.title}
                        </h3>

                        <p className="mt-4 text-sm text-slate-600 leading-7 relative z-10">
                          {feature.description}
                        </p>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-24" id="testimonials">
              <FadeIn className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.3em] text-accent/80">
                  Testimonials
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                  Loved by brands and creators alike
                </h2>
              </FadeIn>

              <div className="mt-16 grid gap-6 lg:grid-cols-3">
                {testimonials.map((t, index) => (
                  <FadeIn key={t.author} delay={index * 0.1}>
                    <div className="h-[100%] rounded-3xl border border-slate-200 bg-white/70 backdrop-blur p-8 shadow-sm hover:shadow-lg transition">
                      <p className="text-base text-slate-700 leading-7">
                        “{t.quote}”
                      </p>

                      <div className="mt-6">
                        <p className="font-semibold">{t.author}</p>
                        <p className="text-sm text-slate-500">{t.role}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </section>

            <section className="bg-slate-50 py-24" id="pricing">
              <div className="mx-auto max-w-7xl px-6" >

                <FadeIn className="max-w-2xl">
                  <p className="text-sm uppercase tracking-[0.3em] text-blue-500">
                    Pricing
                  </p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                    Flexible plans for every stage
                  </h2>
                </FadeIn>

                <div className="mt-16 grid gap-6 lg:grid-cols-3">
                  {pricingPlans.map((plan, index) => (
                    <FadeIn key={plan.name} delay={index * 0.1}>
                      <div className={`h-[100%] rounded-3xl p-8 shadow-sm hover:shadow-xl transition ${index === 1
                          ? "bg-gradient-to-b from-blue-600 to-blue-500 text-white scale-200"
                          : "bg-white border border-slate-200"
                        }`}>

                        <h3 className="text-xl font-semibold">{plan.name}</h3>

                        <div className="mt-6 text-4xl font-bold">
                          {plan.price}
                        </div>

                        <p className="mt-4 text-sm">
                          {plan.description}
                        </p>

                        <div className="mt-6 space-y-3 text-sm">
                          {plan.points.map((point) => (
                            <div key={point} className="flex gap-3 items-center">
                              <span className="mt-1 h-2 w-2 rounded-full bg-current" />
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>

                        <button className="mt-8 w-full rounded-full bg-white text-blue-600 py-3 font-semibold">
                          Get started
                        </button>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA SECTION */}
            <section className="mx-auto max-w-7xl px-6 pb-24">
              <FadeIn className="rounded-[2.5rem] border border-slate-200 bg-gradient-to-r from-white to-blue-50 p-10 shadow-lg flex flex-col lg:flex-row justify-between items-center gap-6">

                <div>
                  <h2 className="text-3xl font-semibold">
                    Ready to launch your creator engine?
                  </h2>
                  <p className="text-slate-600 mt-2">
                    Start building scalable campaigns today.
                  </p>
                </div>

                <Link
                  href={isLoggedIn ? "/dashboard" : "/signup"}
                  className="rounded-full bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Get Started"}
                </Link>
              </FadeIn>
            </section>

          </main>
        </PageTransition>

        <MarketingFooter />
      </div>
    </div>
  );
}
