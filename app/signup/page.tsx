import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { SignupRoleTabs } from "@/components/auth/signup-role-tabs";
import { BrandMark } from "@/components/shared/brand-mark";

export default function SignupPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f2ec] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(7,107,210,0.1),_transparent_28%),radial-gradient(circle_at_84%_18%,_rgba(15,23,42,0.04),_transparent_18%),linear-gradient(180deg,_#faf7f2,_#f6f2ec_50%,_#f1ece5_100%)]" />
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl justify-between">
          <BrandMark href="/" tone="light" />
          <Link
            href="/"
            className="text-sm text-slate-500 transition hover:text-slate-900"
          >
            Back to home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[38rem] flex-1 flex-col justify-center py-10">
          <div className="rounded-[2rem] border border-white/70 bg-white/68 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
            <div className="space-y-8">
              <div className="space-y-5 text-center">
                <div className="flex justify-center">
                  <div className="inline-flex items-center rounded-full border border-[rgba(7,107,210,0.14)] bg-[rgba(7,107,210,0.08)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#076BD2]">
                    Brand onboarding
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    Create your brand account
                  </h1>
                  <p className="mx-auto max-w-[30rem] text-base leading-7 text-slate-500 sm:text-lg">
                    Set up your CIRCL workspace to publish campaigns, review
                    creator submissions, and manage payouts from one polished
                    dashboard.
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <SignupRoleTabs
                  activeRole="brand"
                  className="max-w-[18.75rem]"
                />
              </div>
              <SignupForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
