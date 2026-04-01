// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";

// export async function POST(req: Request) {
//   const supabase = await createClient();

//   // Get logged-in user (brand)
//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (!user || userError) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     const body = await req.json();

//     const email = body.email?.trim().toLowerCase();
//     const role = body.role;

//     if (!email) {
//       return NextResponse.json(
//         { error: "Email is required" },
//         { status: 400 }
//       );
//     }

//     if (!["admin", "member"].includes(role)) {
//       return NextResponse.json(
//         { error: "Invalid role" },
//         { status: 400 }
//       );
//     }

//     const { data: existingInvite } = await supabase
//       .from("team_invitations")
//       .select("id")
//       .eq("brand_id", user.id)
//       .eq("email", email)
//       .eq("status", "pending")
//       .maybeSingle();

//     if (existingInvite) {
//       return NextResponse.json(
//         { error: "User already invited" },
//         { status: 400 }
//       );
//     }

//     const { data: existingUser } = await supabase
//       .from("users")
//       .select("id")
//       .eq("email", email)
//       .maybeSingle();

//     if (existingUser) {
//       const { data: existingMember } = await supabase
//         .from("team_members")
//         .select("id")
//         .eq("brand_id", user.id)
//         .eq("user_id", existingUser.id)
//         .maybeSingle();

//       if (existingMember) {
//         return NextResponse.json(
//           { error: "User is already a team member" },
//           { status: 400 }
//         );
//       }
//     }

//     const { data, error } = await supabase
//       .from("team_invitations")
//       .insert({
//         brand_id: user.id,
//         email,
//         role,
//       })
//       .select()
//       .single();

//     if (error) {
//       console.error("INVITE ERROR:", error);
//       return NextResponse.json(
//         { error: "Failed to send invitation" },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Invitation sent successfully",
//       data,
//     });

//   } catch (err) {
//     console.error("SERVER ERROR:", err);
//     return NextResponse.json(
//       { error: "Something went wrong" },
//       { status: 500 }
//     );
//   }
// }




import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  // Get logged-in user (brand)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      .eq("brand_id", user.id)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json(
        { error: "User already invited" },
        { status: 400 }
      );
    }

    // =========================
    // CHECK EXISTING USER / MEMBER
    // =========================
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("brand_id", user.id)
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a team member" },
          { status: 400 }
        );
      }
    }

    // =========================
    // INSERT INVITATION
    // =========================
    const { data, error } = await supabase
      .from("team_invitations")
      .insert({
        brand_id: user.id,
        email,
        role,
        permissions,
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