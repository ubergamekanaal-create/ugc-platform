import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CREATOR_PORTFOLIO_ASSETS_BUCKET } from "@/lib/creator-profile/assets";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CreatorAssetRouteProps = {
  params: {
    assetId: string;
  };
};

export async function DELETE(
  _request: Request,
  { params }: CreatorAssetRouteProps,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "creator") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: asset, error: assetError } = await supabase
    .from("creator_profile_assets")
    .select("id, user_id, storage_path")
    .eq("id", params.assetId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (assetError) {
    return NextResponse.json({ error: assetError.message }, { status: 400 });
  }

  if (!asset) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const { error: storageError } = await admin.storage
    .from(CREATOR_PORTFOLIO_ASSETS_BUCKET)
    .remove([asset.storage_path]);

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("creator_profile_assets")
    .delete()
    .eq("id", asset.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
