import Link from "next/link";
import { CreatorSignupFlow } from "@/components/auth/creator-signup-flow";
import { SignupRoleTabs } from "@/components/auth/signup-role-tabs";
import { BrandMark } from "@/components/shared/brand-mark";

export default function CreatorSignupPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f8fc] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(7,107,210,0.14),_transparent_28%),radial-gradient(circle_at_84%_18%,_rgba(59,130,246,0.12),_transparent_18%),linear-gradient(180deg,_#ffffff,_#f5f8fc_45%,_#eef4fb_100%)]" />
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10 flex min-h-screen flex-col px-6 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <BrandMark tone="light" />
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="text-sm text-slate-500 transition hover:text-slate-900"
            >
              Back to home
            </Link>
            <Link
              href="/login?role=creator"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 px-4 text-sm font-medium text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:border-accent/20 hover:text-accent"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col py-8">
          <div className="flex justify-center">
            <SignupRoleTabs activeRole="creator" />
          </div>

          <div className="mt-6 flex-1">
            <CreatorSignupFlow />
          </div>
        </div>
      </div>
    </div>
  );
}
