import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();

  // =========================
  // QUERY PARAMS
  // =========================
  const { searchParams } = new URL(req.url);

  const page = Number(
    searchParams.get("page") || 1
  );

  const limit = Number(
    searchParams.get("limit") || 10
  );

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // =========================
  // AUTH
  // =========================
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // =========================
    // GET CURRENT BRAND
    // =========================
    const {
      data: currentBrand,
      error: brandError,
    } = await supabase
      .from("brands")
      .select(`
        id,
        full_name
      `)
      .eq("user_id", user.id)
      .single();

    if (brandError || !currentBrand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    // =========================
    // GET MEMBERS
    // =========================
    const {
      data: members,
      count,
      error,
    } = await supabase
      .from("team_members")
      .select(
        `
          id,
          user_id,
          brand_id,
          role,
          permissions,
          workspace_id,
          created_at
        `,
        {
          count: "exact",
        }
      )
      .eq("workspace_id", currentBrand.id)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    if (!members?.length) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
        },
      });
    }

    // =========================
    // MAIN OWNER
    // =========================
    const mainOwnerId =
      members.find(
        (m) => m.role === "owner"
      )?.user_id;

    // =========================
    // PAGINATION
    // =========================
    const paginatedMembers =
      members.slice(from, to + 1);

    const userIds =
      paginatedMembers.map(
        (m) => m.user_id
      );

    // =========================
    // USERS DATA
    // =========================
    const {
      data: users,
      error: usersError,
    } = await supabase
      .from("users")
      .select(`
        id,
        email,
        full_name,
        avatar_url
      `)
      .in("id", userIds);

    if (usersError) {
      throw usersError;
    }

    // =========================
    // FINAL RESPONSE
    // =========================
    const finalData =
      paginatedMembers.map((m) => {
        const u = users?.find(
          (x) => x.id === m.user_id
        );

        return {
          id: m.id,

          brand_id: m.brand_id,
          workspace_id: m.workspace_id,
          role: m.role,

          permissions:
            m.permissions || {},

          created_at:
            m.created_at,

          is_current_user:
            m.user_id === user.id,

          is_main_owner:
            m.user_id ===
            mainOwnerId,

          user: {
            id: u?.id || null,

            email:
              u?.email || "",

            name:
              u?.full_name || "",

            avatar_url:
              u?.avatar_url ||
              null,
          },
        };
      });

    return NextResponse.json({
      success: true,

      brand: {
        id: currentBrand.id,
        name:
          currentBrand.full_name,
      },

      data: finalData,

      pagination: {
        total:
          count || members.length,
        page,
        limit,
      },
    });

  } catch (err) {
    console.error(
      "MEMBERS API ERROR:",
      err
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch members",
      },
      { status: 500 }
    );
  }
}