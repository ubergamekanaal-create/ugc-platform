import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
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
    const {
      data: memberships,
      error: membershipError,
    } = await supabase
      .from("team_members")
      .select(`
        brand_id,
        workspace_id,
        user_id,
        role,
        permissions,
        created_at
      `)
      .eq("user_id", user.id);

    if (membershipError) {
      throw membershipError;
    }

    if (!memberships?.length) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }
    const workspaceIds =
      memberships
        .map(
          (m) => m.workspace_id
        )
        .filter(Boolean);
    const {
      data: brands,
      error: brandsError,
    } = await supabase
      .from("brands")
      .select(`
        id,
        user_id,
        full_name,
        email
      `)
      .in("id", workspaceIds);

    if (brandsError) {
      throw brandsError;
    }

    // =========================
    // REMOVE DUPLICATE BRANDS
    // =========================
    const uniqueMemberships =
      memberships.filter(
        (membership, index, self) =>
          index ===
          self.findIndex(
            (m) =>
              m.workspace_id ===
              membership.workspace_id
          )
      );

    // =========================
    // MERGE DATA
    // =========================
    const finalData =
      uniqueMemberships.map(
        (membership) => {
          const brand = brands?.find(
            (b) =>
              b.id ===
              membership.workspace_id
          );

          return {
            brand_id:
              membership.brand_id,
            workspace_id:
              membership.workspace_id,
            role: membership.role,
            permissions:
              membership.permissions || {},
            created_at:
              membership.created_at,
            brand: {
              id: brand?.id || null,

              user_id:
                brand?.user_id || null,

              full_name:
                brand?.full_name || "",

              email:
                brand?.email || "",
            },
          };
        }
      );

    return NextResponse.json({
      success: true,
      data: finalData,
    });

  } catch (err) {
    console.error(
      "MY BRANDS API ERROR:",
      err
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch brands",
      },
      { status: 500 }
    );
  }
}