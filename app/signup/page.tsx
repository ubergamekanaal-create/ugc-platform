import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { SignupRoleTabs } from "@/components/auth/signup-role-tabs";
import { BrandMark } from "@/components/shared/brand-mark";

export default function SignupPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f2ec] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(7,107,210,0.1),_transparent_28%),radial-gradient(circle_at_84%_18%,_rgba(15,23,42,0.04),_transparent_18%),linear-gradient(180deg,_#faf7f2,_#f6f2ec_50%,_#f1ece5_100%)]" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-[34rem] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-slate-500 transition hover:text-slate-900"
            >
              Back to home
            </Link>
            <Link
              href="/login?role=brand"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 px-4 text-sm font-medium text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:border-accent/20 hover:text-accent"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[34rem] flex-1 flex-col justify-center py-10">
          <div className="space-y-8">
            <div className="flex justify-center">
              <BrandMark tone="light" />
            </div>

            <div className="space-y-3 text-center">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Create your brand account
              </h1>
              <p className="text-base leading-7 text-slate-500 sm:text-lg">
                Sign up to manage your brand on CIRCL.
              </p>
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
  );
}
