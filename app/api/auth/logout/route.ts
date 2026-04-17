import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from("users")
      .update({ active: false })
      .eq("id", user.id);
  }

  await supabase.auth.signOut();

  return NextResponse.json({ redirectTo: "/login" });
}