import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AcceptInviteBody = {
  inviteId: string;
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json(
      { error: "Missing service role key" },
      { status: 503 }
    );
  }

  // =========================
  // AUTH
  // =========================
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
    const body: AcceptInviteBody = await req.json();
    const { inviteId } = body;

    if (!inviteId) {
      return NextResponse.json(
        { error: "Invite ID required" },
        { status: 400 }
      );
    }

    // =========================
    // GET INVITE
    // =========================
    const { data: invite, error: inviteError } = await admin
      .from("team_invitations")
      .select("*")
      .eq("id", inviteId)
      .eq("status", "pending")
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invitation not found or already used" },
        { status: 404 }
      );
    }

    // =========================
    // EXPIRED CHECK
    // =========================
    // const isExpired =
    //   new Date(invite.expires_at).getTime() < Date.now();

    // if (isExpired) {
    //   return NextResponse.json(
    //     { error: "Invitation expired" },
    //     { status: 400 }
    //   );
    // }

    // =========================
    // EXPIRED CHECK (7 DAYS)
    // =========================
    const invitedTime = new Date(invite.invited_at).getTime();

    const sevenDaysInMs =
      7 * 24 * 60 * 60 * 1000;

    const isExpired =
      Date.now() > invitedTime + sevenDaysInMs;

    if (isExpired) {

      await admin
        .from("team_invitations")
        .update({
          status: "expired",
        })
        .eq("id", invite.id);

      return NextResponse.json(
        { error: "Invitation expired" },
        { status: 400 }
      );
    }

    if (
      invite.email.toLowerCase() !==
      user.email?.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: "This invitation is not for you",
          currentUserEmail: user.email,
          invitedEmail: invite.email,
        },
        { status: 403 }
      );
    }

    // =========================
    // CHECK USER ROLE
    // =========================
    const { data: existingUser, error: userProfileError } =
      await admin
        .from("users")
        .select("id, role")
        .eq("id", user.id)
        .single();

    if (userProfileError || !existingUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    if (existingUser.role === "creator") {
      return NextResponse.json(
        {
          error:
            "Creators cannot join brand teams",
        },
        { status: 403 }
      );
    }

    // =========================
    // CHECK EXISTING MEMBER
    // =========================
    const { data: existingMember } = await admin
      .from("team_members")
      .select("id")
      // .eq("brand_id", invite.brand_id)
      .eq(
        "workspace_id",
        invite.workspace_id
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: "Already part of this team" },
        { status: 400 }
      );
    }

    // =========================
    // ADD MEMBER
    // =========================
    const { error: memberError } = await admin
      .from("team_members")
      .insert({
        workspace_id:
          invite.workspace_id,
        brand_id: invite.brand_id,
        user_id: user.id,
        role: invite.role,
        permissions: invite.permissions || {},
        // invited_by: invite.invited_by,
        // joined_at: new Date().toISOString(),
      });

    if (memberError) {
      throw memberError;
    }

    // =========================
    // UPDATE INVITATION
    // =========================
    const { error: updateError } = await admin
      .from("team_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", inviteId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
    });

  } catch (err) {
    console.error("ACCEPT INVITE ERROR:", err);

    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}