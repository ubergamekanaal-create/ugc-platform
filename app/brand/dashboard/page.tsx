import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function BrandDashboardRedirectPage() {

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: brandProfile } =
    await supabase
      .from("brands")
      .select(
        "onboarding_completed_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

  if (
    !brandProfile?.onboarding_completed_at
  ) {
    redirect(
      "/brand/brand-setup"
    );
  }

  redirect("/dashboard");
}