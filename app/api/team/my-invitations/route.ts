import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // 🔐 AUTH
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const { data, error } = await supabase
      .from("team_invitations")
      .select("id, email, role, permissions, invited_at, brand_id")
      .eq("email", user.email)
      .eq("status", "pending")
      // .order("invited_at", { ascending: false });

    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      data: data || [],
    });

  } catch (err) {
    console.error("MY INVITES ERROR:", err);

    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}