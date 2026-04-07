import Link from "next/link";
import { redirect } from "next/navigation";
import { CreatorSignupFlow } from "@/components/auth/creator-signup-flow";
import { SignupRoleTabs } from "@/components/auth/signup-role-tabs";
import { BrandMark } from "@/components/shared/brand-mark";
import { createClient } from "@/lib/supabase/server";

export default async function CreatorSignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f2ec] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(7,107,210,0.1),_transparent_28%),radial-gradient(circle_at_84%_18%,_rgba(15,23,42,0.04),_transparent_18%),linear-gradient(180deg,_#faf7f2,_#f6f2ec_50%,_#f1ece5_100%)]" />

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-3 py-3 sm:px-5 sm:py-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <BrandMark href="/" tone="light" />
          <Link
            href="/"
            className="text-xs text-slate-500 transition hover:text-slate-900 sm:text-sm"
          >
            Back to home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[39rem] flex-1 flex-col justify-center py-8 md:py-6">
          {/* <div className="rounded-[1.5rem] border border-white/70 bg-white/72 p-2 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl"> */}
          <div className="rounded-[1.5rem] p-2">
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <h1 className="font-display text-[1.6rem] font-semibold tracking-tight text-slate-950 sm:text-[2.1rem]">
                  Create your creator account
                </h1>
                <p className="mx-auto max-w-[26rem] text-xs leading-5 text-slate-500 sm:text-sm">
                  Set up your profile quickly and start getting campaign
                  invites.
                </p>
              </div>

              <div className="flex justify-center">
                <SignupRoleTabs
                  activeRole="creator"
                  className="max-w-[18.75rem]"
                />
              </div>
              <CreatorSignupFlow />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
