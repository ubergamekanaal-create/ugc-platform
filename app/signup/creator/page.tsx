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
    <div className="relative min-h-screen overflow-hidden bg-[#fdfbff]  text-slate-900">

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-3 py-3 sm:px-5 sm:py-4">
        <div className="mx-auto flex w-full flex-1 flex-col justify-center py-8 md:py-0">
          <div className="rounded-[1.5rem]">
            <div className="space-y-4">
              <CreatorSignupFlow />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
