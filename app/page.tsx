import { HomePage } from "@/components/marketing/home-page";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <HomePage isLoggedIn={Boolean(user)} />;
}
