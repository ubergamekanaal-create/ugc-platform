import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildCreatorPortfolioAssetPath,
  CREATOR_PORTFOLIO_ASSETS_BUCKET,
  getCreatorPortfolioAssetKind,
  MAX_CREATOR_PORTFOLIO_FILES,
  MAX_CREATOR_PORTFOLIO_FILE_BYTES,
} from "@/lib/creator-profile/assets";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
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

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!files.length) {
    return NextResponse.json(
      { error: "Select at least one file to upload." },
      { status: 400 },
    );
  }

  if (files.length > MAX_CREATOR_PORTFOLIO_FILES) {
    return NextResponse.json(
      {
        error: `You can upload up to ${MAX_CREATOR_PORTFOLIO_FILES} portfolio files at a time.`,
      },
      { status: 400 },
    );
  }

  const oversizedFile = files.find(
    (file) => file.size > MAX_CREATOR_PORTFOLIO_FILE_BYTES,
  );

  if (oversizedFile) {
    return NextResponse.json(
      {
        error: `${oversizedFile.name} is larger than ${Math.round(
          MAX_CREATOR_PORTFOLIO_FILE_BYTES / (1024 * 1024),
        )} MB.`,
      },
      { status: 400 },
    );
  }

  const { count: existingAssetCount, error: countError } = await supabase
    .from("creator_profile_assets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 400 });
  }

  if ((existingAssetCount ?? 0) + files.length > MAX_CREATOR_PORTFOLIO_FILES) {
    return NextResponse.json(
      {
        error: `You can keep up to ${MAX_CREATOR_PORTFOLIO_FILES} samples in your portfolio.`,
      },
      { status: 400 },
    );
  }

  const uploadedPaths: string[] = [];

  for (const file of files) {
    const path = buildCreatorPortfolioAssetPath({
      userId: user.id,
      fileName: file.name,
    });
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from(CREATOR_PORTFOLIO_ASSETS_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      if (uploadedPaths.length) {
        await admin.storage
          .from(CREATOR_PORTFOLIO_ASSETS_BUCKET)
          .remove(uploadedPaths);
      }

      return NextResponse.json(
        { error: uploadError.message },
        { status: 400 },
      );
    }

    uploadedPaths.push(path);
  }

  const { data: insertedAssets, error: insertError } = await supabase
    .from("creator_profile_assets")
    .insert(
      uploadedPaths.map((path, index) => ({
        user_id: user.id,
        file_name: files[index]?.name ?? "Portfolio asset",
        storage_path: path,
        mime_type: files[index]?.type || null,
        kind: getCreatorPortfolioAssetKind(files[index]?.type || null),
        size_bytes: files[index]?.size ?? 0,
        caption: null,
        sort_order: (existingAssetCount ?? 0) + index,
      })),
    )
    .select(
      "id, user_id, file_name, storage_path, mime_type, kind, size_bytes, caption, sort_order, created_at",
    );

  if (insertError) {
    await admin.storage.from(CREATOR_PORTFOLIO_ASSETS_BUCKET).remove(uploadedPaths);
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ assets: insertedAssets ?? [] });
}
