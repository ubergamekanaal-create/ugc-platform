import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  //  Auth
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
    const { inviteId } = await req.json();

    if (!inviteId) {
      return NextResponse.json(
        { error: "Invite ID required" },
        { status: 400 }
      );
    }

    //  Get invite
    const { data: invite, error: inviteError } = await supabase
      .from("team_invitations")
      .select("id, email, status")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    //  Security check (only invited user)
    if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "Invitation already handled" },
        { status: 400 }
      );
    }

    // Update status → rejected
    const { error: updateError } = await supabase
      .from("team_invitations")
      .update({
        status: "rejected",
      })
      .eq("id", inviteId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "Invitation rejected",
    });

  } catch (err) {
    console.error("REJECT INVITE ERROR:", err);

    return NextResponse.json(
      { error: "Failed to reject invitation" },
      { status: 500 }
    );
  }
}