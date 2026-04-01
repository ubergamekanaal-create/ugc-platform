import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =========================
// DELETE MEMBER
// =========================
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const memberId = params.id;

    const { data: targetMember, error: targetError } = await supabase
      .from("team_members")
      .select("id, user_id, role, brand_id")
      .eq("id", memberId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const { data: currentMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("brand_id", targetMember.brand_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const isOwner = user.id === targetMember.brand_id;
    const currentRole = isOwner ? "owner" : currentMember?.role;

    const { data: allMembers } = await supabase
      .from("team_members")
      .select("user_id, role, created_at")
      .eq("brand_id", targetMember.brand_id)
      .order("created_at", { ascending: true });

    const mainOwnerId = allMembers?.find((m) => m.role === "owner")?.user_id;

    if (currentRole !== "owner") {
      return NextResponse.json(
        { error: "Only owner can remove members" },
        { status: 403 }
      );
    }

    if (targetMember.user_id === user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 400 }
      );
    }

    if (targetMember.user_id === mainOwnerId) {
      return NextResponse.json(
        { error: "Main owner cannot be removed" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId)
      .eq("brand_id", targetMember.brand_id);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });

  } catch (err) {
    console.error("DELETE MEMBER ERROR:", err);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}


// =========================
// UPDATE PERMISSIONS
// =========================
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const memberId = params.id;
    const { permissions } = await req.json();

    const { data: targetMember, error: targetError } = await supabase
      .from("team_members")
      .select("id, user_id, role, brand_id")
      .eq("id", memberId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const { data: currentMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("brand_id", targetMember.brand_id)
      .eq("user_id", user.id)
      .maybeSingle();

    const isOwner = user.id === targetMember.brand_id;
    const currentRole = isOwner ? "owner" : currentMember?.role;

    if (currentRole !== "owner" && currentRole !== "admin") {
      return NextResponse.json(
        { error: "Not allowed to update permissions" },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabase
      .from("team_members")
      .update({ permissions })
      .eq("id", memberId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "Permissions updated successfully",
    });

  } catch (err) {
    console.error("UPDATE PERMISSIONS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to update permissions" },
      { status: 500 }
    );
  }
}