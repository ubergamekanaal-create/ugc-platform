// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";

// export async function POST() {
//   const supabase = await createClient();

//   // 🔐 Get logged-in user (creator)
//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (!user || userError) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     // =========================
//     //  FIND PENDING INVITE
//     // =========================
//     const { data: invite, error: inviteError } = await supabase
//       .from("team_invitations")
//       .select("*")
//       .eq("email", user.email)
//       .eq("status", "pending")
//       .maybeSingle();

//     if (inviteError) throw inviteError;

//     if (!invite) {
//       return NextResponse.json(
//         { error: "No pending invitation found" },
//         { status: 404 }
//       );
//     }

//     // =========================
//     //  ADD TO TEAM
//     // =========================
//     const { error: memberError } = await supabase
//       .from("team_members")
//       .upsert(
//         {
//           brand_id: invite.brand_id,
//           user_id: user.id,
//           role: invite.role,
//         },
//         { onConflict: "brand_id,user_id" }
//       );

//     if (memberError) throw memberError;

//     // =========================
//     //  UPDATE INVITE STATUS
//     // =========================
//     const { error: updateError } = await supabase
//       .from("team_invitations")
//       .update({
//         status: "accepted",
//         accepted_at: new Date(),
//       })
//       .eq("id", invite.id);

//     if (updateError) throw updateError;

//     return NextResponse.json({
//       success: true,
//       message: "Invitation accepted",
//     });

//   } catch (err: any) {
//     console.error("ACCEPT ERROR:", err);
//     return NextResponse.json(
//       { error: "Failed to accept invitation" },
//       { status: 500 }
//     );
//   }
// }




import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type AcceptInviteBody = {
  inviteId: string;
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();

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
    //  GET INVITE
    // =========================
    const { data: invite, error: inviteError } = await supabase
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

    //  Ensure same email
    if (invite.email !== user.email) {
      return NextResponse.json(
        { error: "This invitation is not for you" },
        { status: 403 }
      );
    }

    // =========================
    //  CHECK IF ALREADY MEMBER
    // =========================
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("brand_id", invite.brand_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: "Already part of this team" },
        { status: 400 }
      );
    }

    // =========================
    //  ADD MEMBER
    // =========================
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        brand_id: invite.brand_id,
        user_id: user.id,
        role: invite.role,
        permissions: invite.permissions || {},
      });

    if (memberError) throw memberError;

    // =========================
    //  UPDATE INVITE
    // =========================
    const { error: updateError } = await supabase
      .from("team_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", inviteId);

    if (updateError) throw updateError;

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