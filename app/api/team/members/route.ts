// import { NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase/server";

// export async function GET(req: Request) {
//   const supabase = await createClient();

//   const { searchParams } = new URL(req.url);
//   const page = Number(searchParams.get("page") || 1);
//   const limit = Number(searchParams.get("limit") || 10);

//   const from = (page - 1) * limit;
//   const to = from + limit - 1;

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     // =========================
//     // GET MEMBERS (WITH PERMISSIONS)
//     // =========================
//     const { data: members, count, error } = await supabase
//       .from("team_members")
//       .select("id, user_id, role, permissions, created_at", {
//         count: "exact",
//       })
//       .eq("brand_id", user.id)
//       .range(from, to)
//       .order("created_at", { ascending: false });

//     if (error) throw error;

//     if (!members || members.length === 0) {
//       return NextResponse.json({
//         success: true,
//         data: [],
//         pagination: { total: 0, page, limit },
//       });
//     }

//     // =========================
//     //  GET USERS DATA
//     // =========================
//     const userIds = members.map((m) => m.user_id);

//     const { data: users, error: usersError } = await supabase
//       .from("users")
//       .select("id, email, full_name, avatar_url")
//       .in("id", userIds);

//     if (usersError) throw usersError;

//     // =========================
//     // MERGE DATA
//     // =========================
//     const finalData = members.map((m) => {
//       const u = users?.find((x) => x.id === m.user_id);

//       return {
//         id: m.id,
//         role: m.role,
//         permissions: m.permissions || {}, // IMPORTANT
//         created_at: m.created_at,

//         user: {
//           id: u?.id || null,
//           email: u?.email || "",
//           name: u?.full_name || "",
//           avatar_url: u?.avatar_url || null,
//         },
//       };
//     });

//     return NextResponse.json({
//       success: true,
//       data: finalData,
//       pagination: {
//         total: count || 0,
//         page,
//         limit,
//       },
//     });

//   } catch (err) {
//     console.error("MEMBERS API ERROR:", err);

//     return NextResponse.json(
//       { error: "Failed to fetch members" },
//       { status: 500 }
//     );
//   }
// }




import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // =========================
    // GET MEMBERS
    // =========================
    const { data: members, count, error } = await supabase
      .from("team_members")
      .select("id, user_id, role, permissions, created_at", {
        count: "exact",
      })
      .eq("brand_id", user.id)
      .order("created_at", { ascending: true }); // 🔥 important

    if (error) throw error;

    if (!members || members.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { total: 0, page, limit },
      });
    }

    // =========================
    // MAIN OWNER IDENTIFICATION
    // =========================
    const mainOwnerId = members.find((m) => m.role === "owner")?.user_id;

    // =========================
    // PAGINATION APPLY
    // =========================
    const paginatedMembers = members.slice(from, to + 1);

    const userIds = paginatedMembers.map((m) => m.user_id);

    // =========================
    // GET USERS DATA
    // =========================
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name, avatar_url")
      .in("id", userIds);

    if (usersError) throw usersError;

    // =========================
    // MERGE DATA
    // =========================
    const finalData = paginatedMembers.map((m) => {
      const u = users?.find((x) => x.id === m.user_id);

      return {
        id: m.id,
        role: m.role,
        permissions: m.permissions || {},
        created_at: m.created_at,

        // 🔥 NEW FLAGS
        is_current_user: m.user_id === user.id,
        is_main_owner: m.user_id === mainOwnerId,

        user: {
          id: u?.id || null,
          email: u?.email || "",
          name: u?.full_name || "",
          avatar_url: u?.avatar_url || null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: finalData,
      pagination: {
        total: count || members.length,
        page,
        limit,
      },
    });

  } catch (err) {
    console.error("MEMBERS API ERROR:", err);

    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}