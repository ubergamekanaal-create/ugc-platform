import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
export async function POST(req: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }
  // Get logged-in user (brand)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();;

  if (!user || userError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // =========================
  // GET CURRENT WORKSPACE
  // =========================

  const {
    data: currentWorkspace,
    error: workspaceError,
  } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (
    workspaceError ||
    !currentWorkspace
  ) {
    return NextResponse.json(
      {
        error: "Workspace not found",
      },
      { status: 404 }
    );
  }
  try {
    const body = await req.json();

    const email = body.email?.trim().toLowerCase();
    const role = body.role;
    let permissions = body.permissions || {};

    // =========================
    // VALIDATION
    // =========================
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    if (email === user.email) {
      return NextResponse.json(
        { error: "You cannot invite yourself" },
        { status: 400 }
      );
    }
    if (!["owner", "admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // =========================
    // DEFAULT PERMISSIONS
    // =========================
    const ALL_PERMISSIONS = {
      include_in_chats: true,
      view_analytics: true,
      manage_submissions: true,
      manage_creators: true,
      view_finance: true,
      manage_campaigns: true,
      manage_integrations: true,
      manage_settings: true,
    };

    // OWNER → FORCE ALL TRUE
    if (role === "owner") {
      permissions = ALL_PERMISSIONS;
    }

    // =========================
    // CHECK EXISTING INVITE
    // =========================
    const { data: existingInvite } = await supabase
      .from("team_invitations")
      .select("id")
      // .eq("brand_id", user.id)
      .eq(
        "workspace_id",
        currentWorkspace.id
      )
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json(
        { error: "User already invited" },
        { status: 400 }
      );
    }


    const { data: existingUser, error: existingUserError } = await admin
      .from("users")
      .select("id, role")
      .eq("email", email)
      .maybeSingle();
    if (existingUser) {
      if (existingUser.role !== "brand") {
        return NextResponse.json(
          {
            error:
              "Only brand users can be invited to a team",
          },
          { status: 400 }
        );
      }
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        // .eq("brand_id", user.id)
        .eq(
          "workspace_id",
          currentWorkspace.id
        )
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a team member" },
          { status: 400 }
        );
      }
    }
    const token = crypto.randomUUID();
    // =========================
    // INSERT INVITATION
    // =========================
    const { data, error } = await supabase
      .from("team_invitations")
      .insert({
        workspace_id:
          currentWorkspace.id,
        brand_id: user.id,
        email,
        role,
        permissions,
        token,
        status: "pending",
        invited_at: new Date().toISOString(),
        invited_by: user.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .select()
      .single();

    if (error) {
      console.error("INVITE ERROR:", error);
      return NextResponse.json(
        { error: "Failed to send invitation" },
        { status: 500 }
      );
    }
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`;

    const emailRes = await resend.emails.send({
      from: "Circl <onboarding@resend.dev>", // or your custom domain
      to: email,
      subject: "You're invited to join a team",
      html: `
        <div style="font-family:sans-serif;">
          <h2>You've been invited to join a team 🎉</h2>
          <p><b>${user.email}</b> invited you</p>
          <p>Role: <b>${role}</b></p>
          <p>This invite expires in 24 hours.</p>
          <a href="${inviteLink}" 
            style="padding:10px 16px;background:black;color:white;border-radius:6px;text-decoration:none;">
            Accept Invitation
          </a>
        </div>
      `,
    });

    if (emailRes.error) {
      console.error("EMAIL FULL RESPONSE:", emailRes);

      if (data?.id) {
        await supabase
          .from("team_invitations")
          .delete()
          .eq("id", data.id);
      }

      return NextResponse.json(
        { error: "Failed to send invitation email. Please try again." },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      data,
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}