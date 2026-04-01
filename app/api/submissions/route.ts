import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildSubmissionAssetPath,
  MAX_SUBMISSION_FILE_BYTES,
  MAX_SUBMISSION_FILES,
  SUBMISSION_ASSETS_BUCKET,
} from "@/lib/submissions/assets";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CreateSubmissionBody = {
  campaignId?: string;
  contentLinks?: string[];
  notes?: string;
  hasAssetUploads?: boolean;
};

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

  const contentType = request.headers.get("content-type") ?? "";
  let campaignId = "";
  let notes = "";
  let contentLinks: string[] = [];
  let files: File[] = [];
  let hasAssetUploads = false;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    campaignId = String(formData.get("campaignId") ?? "").trim();
    notes = String(formData.get("notes") ?? "").trim();
    const rawLinks = String(formData.get("contentLinks") ?? "").trim();
    contentLinks = rawLinks
      ? (() => {
          try {
            const parsed = JSON.parse(rawLinks);
            if (Array.isArray(parsed)) {
              return parsed
                .map((item) => String(item).trim())
                .filter(Boolean);
            }
          } catch {
            return rawLinks
              .split(/\n+/)
              .map((item) => item.trim())
              .filter(Boolean);
          }

          return [];
        })()
      : [];
    files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0);
    hasAssetUploads = files.length > 0;
  } else {
    const body = (await request.json().catch(() => null)) as CreateSubmissionBody | null;
    campaignId = body?.campaignId?.trim() ?? "";
    contentLinks = (body?.contentLinks ?? [])
      .map((item) => item.trim())
      .filter(Boolean);
    notes = body?.notes?.trim() ?? "";
    hasAssetUploads = Boolean(body?.hasAssetUploads);
  }

  if (!campaignId || (!contentLinks.length && !hasAssetUploads)) {
    return NextResponse.json(
      { error: "Add at least one content link or uploaded file before submitting." },
      { status: 400 },
    );
  }

  if (files.length > MAX_SUBMISSION_FILES) {
    return NextResponse.json(
      {
        error: `You can upload up to ${MAX_SUBMISSION_FILES} files per submission.`,
      },
      { status: 400 },
    );
  }

  const oversizedFile = files.find((file) => file.size > MAX_SUBMISSION_FILE_BYTES);

  if (oversizedFile) {
    return NextResponse.json(
      {
        error: `${oversizedFile.name} is larger than ${Math.round(
          MAX_SUBMISSION_FILE_BYTES / (1024 * 1024),
        )} MB.`,
      },
      { status: 400 },
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

  const { data: application, error: applicationError } = await supabase
    .from("campaign_applications")
    .select("id, campaign_id, creator_id")
    .eq("campaign_id", campaignId)
    .eq("creator_id", user.id)
    .eq("status", "accepted")
    .maybeSingle();

  if (applicationError) {
    return NextResponse.json(
      { error: applicationError.message },
      { status: 400 },
    );
  }

  if (!application) {
    return NextResponse.json(
      { error: "Only accepted campaign work can be submitted." },
      { status: 403 },
    );
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, brand_id")
    .eq("id", campaignId)
    .maybeSingle();

  if (campaignError) {
    return NextResponse.json(
      { error: campaignError.message },
      { status: 400 },
    );
  }

  if (!campaign) {
    return NextResponse.json(
      { error: "Campaign not found." },
      { status: 404 },
    );
  }

  const { data: existingSubmission, error: submissionLookupError } = await supabase
    .from("campaign_submissions")
    .select("id, status, revision_number")
    .eq("campaign_id", campaignId)
    .eq("creator_id", user.id)
    .maybeSingle();

  if (submissionLookupError) {
    return NextResponse.json(
      { error: submissionLookupError.message },
      { status: 400 },
    );
  }

  if (
    existingSubmission &&
    (existingSubmission.status === "approved" ||
      existingSubmission.status === "rejected")
  ) {
    return NextResponse.json(
      { error: "This submission has already been finalized." },
      { status: 400 },
    );
  }

  const submittedAt = new Date().toISOString();
  const submissionId = existingSubmission?.id ?? crypto.randomUUID();
  const revisionNumber = existingSubmission
    ? existingSubmission.status === "revision_requested"
      ? Number(existingSubmission.revision_number ?? 1) + 1
      : Number(existingSubmission.revision_number ?? 1)
    : 1;
  const uploadedPaths: string[] = [];

  if (files.length) {
    for (const file of files) {
      const path = buildSubmissionAssetPath({
        campaignId,
        creatorId: user.id,
        submissionId,
        revisionNumber,
        fileName: file.name,
      });
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await admin.storage
        .from(SUBMISSION_ASSETS_BUCKET)
        .upload(path, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        if (uploadedPaths.length) {
          await admin.storage.from(SUBMISSION_ASSETS_BUCKET).remove(uploadedPaths);
        }

        return NextResponse.json(
          { error: uploadError.message },
          { status: 400 },
        );
      }

      uploadedPaths.push(path);
    }
  }

  if (existingSubmission) {
    const { data: updatedSubmission, error } = await supabase
      .from("campaign_submissions")
      .update({
        revision_number: revisionNumber,
        content_links: contentLinks,
        notes: notes || null,
        status: "submitted",
        submitted_at: submittedAt,
        reviewed_at: null,
      })
      .eq("id", existingSubmission.id)
      .select(
        "id, campaign_id, brand_id, creator_id, application_id, revision_number, content_links, notes, feedback, status, created_at, updated_at, submitted_at, reviewed_at",
      )
      .single();

    if (error || !updatedSubmission) {
      if (uploadedPaths.length) {
        await admin.storage.from(SUBMISSION_ASSETS_BUCKET).remove(uploadedPaths);
      }

      return NextResponse.json(
        { error: error?.message ?? "Unable to update submission." },
        { status: 400 },
      );
    }

    if (uploadedPaths.length) {
      const { error: assetInsertError } = await admin
        .from("campaign_submission_assets")
        .insert(
          uploadedPaths.map((path, index) => ({
            submission_id: existingSubmission.id,
            campaign_id: campaignId,
            brand_id: campaign.brand_id,
            creator_id: user.id,
            revision_number: revisionNumber,
            file_name: files[index]?.name ?? "Asset",
            storage_path: path,
            mime_type: files[index]?.type || null,
            size_bytes: files[index]?.size ?? 0,
          })),
        );

      if (assetInsertError) {
        await admin.storage.from(SUBMISSION_ASSETS_BUCKET).remove(uploadedPaths);
        return NextResponse.json(
          { error: assetInsertError.message },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({ submission: updatedSubmission });
  }

  const { data: createdSubmission, error: insertError } = await supabase
    .from("campaign_submissions")
    .insert({
      id: submissionId,
      campaign_id: campaignId,
      brand_id: campaign.brand_id,
      creator_id: user.id,
      application_id: application.id,
      revision_number: revisionNumber,
      content_links: contentLinks,
      notes: notes || null,
      status: "submitted",
      submitted_at: submittedAt,
    })
    .select(
      "id, campaign_id, brand_id, creator_id, application_id, revision_number, content_links, notes, feedback, status, created_at, updated_at, submitted_at, reviewed_at",
    )
    .single();

  if (insertError || !createdSubmission) {
    if (uploadedPaths.length) {
      await admin.storage.from(SUBMISSION_ASSETS_BUCKET).remove(uploadedPaths);
    }

    return NextResponse.json(
      { error: insertError?.message ?? "Unable to create submission." },
      { status: 400 },
    );
  }

  if (uploadedPaths.length) {
    const { error: assetInsertError } = await admin
      .from("campaign_submission_assets")
      .insert(
        uploadedPaths.map((path, index) => ({
          submission_id: createdSubmission.id,
          campaign_id: campaignId,
          brand_id: campaign.brand_id,
          creator_id: user.id,
          revision_number: revisionNumber,
          file_name: files[index]?.name ?? "Asset",
          storage_path: path,
          mime_type: files[index]?.type || null,
          size_bytes: files[index]?.size ?? 0,
        })),
      );

    if (assetInsertError) {
      await admin.storage.from(SUBMISSION_ASSETS_BUCKET).remove(uploadedPaths);
      return NextResponse.json(
        { error: assetInsertError.message },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ submission: createdSubmission });
}
