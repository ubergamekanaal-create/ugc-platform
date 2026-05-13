import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // INVITES
    // const { data: invites, error } = await supabase
    //   .from("team_invitations")
    //   .select("id, email, role, permissions, invited_at, brand_id")
    //   .eq("email", user.email)
    //   .eq("status", "pending");
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: invites, error } = await supabase
      .from("team_invitations")
      .select("id, email, role, permissions, invited_at, brand_id, workspace_id")
      .eq("email", user.email)
      .eq("status", "pending")
      .gte("invited_at", sevenDaysAgo);
    if (error) throw error;

    // GET ALL BRAND IDS
    const workspaceIds = invites?.map((inv) => inv.workspace_id) || [];

    // FETCH BRANDS
    const { data: brands, error: brandError } = await supabase
      .from("brands")
      .select("id,user_id, full_name")
      .in("id", workspaceIds);

    // MERGE DATA
    const formattedInvites =
      invites?.map((invite) => {
        const brand = brands?.find((b) => b.id === invite.workspace_id);

        return {
          ...invite,
          brand_name: brand?.full_name || "",
        };
      }) || [];

    return NextResponse.json({
      success: true,
      data: formattedInvites,
    });
  } catch (err) {
    console.error("MY INVITES ERROR:", err);

    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 },
    );
  }
}