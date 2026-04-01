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
//     const { data, count, error } = await supabase
//       .from("team_invitations")
//       .select("*", { count: "exact" })
//       .eq("brand_id", user.id)
//       .eq("status", "pending")
//       .range(from, to)
//       .order("invited_at", { ascending: false });

//     if (error) throw error;

//     return NextResponse.json({
//       success: true,
//       data,
//       pagination: {
//         total: count,
//         page,
//         limit,
//       },
//     });
//   } catch {
//     return NextResponse.json(
//       { error: "Failed to fetch invitations" },
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
    const { data, count, error } = await supabase
      .from("team_invitations")
      .select("id, email, role, permissions, status, invited_at", {
        count: "exact",
      })
      .eq("brand_id", user.id)
      .eq("status", "pending")
      .range(from, to)
      .order("invited_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        page,
        limit,
      },
    });

  } catch (err) {
    console.error("INVITES API ERROR:", err);

    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}