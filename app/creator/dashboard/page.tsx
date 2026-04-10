// import { redirect } from "next/navigation";

// export default function CreatorDashboardRedirectPage() {
//   redirect("/dashboard");
// }


import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CreatorDashboardRedirectPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("onboarding_completed_at")
    .eq("user_id", user.id)
    .single();
  
  if (!profile?.onboarding_completed_at) {
    redirect("/creator/onboarding");
  }
  redirect("/dashboard");
}