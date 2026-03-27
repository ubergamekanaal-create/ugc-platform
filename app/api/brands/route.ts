import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // 🔐 get logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔥 fetch brand profile
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch brand profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}