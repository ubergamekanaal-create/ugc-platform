import { createAdminClient } from "@/lib/supabase/admin";
import type { SubmissionAssetKind } from "@/lib/types";

export const SUBMISSION_ASSETS_BUCKET = "submission-assets";
export const MAX_SUBMISSION_FILES = 10;
export const MAX_SUBMISSION_FILE_BYTES = 25 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function sanitizeFilename(filename: string) {
  const normalized = filename
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "asset";
}

export function getSubmissionAssetKind(
  mimeType?: string | null,
): SubmissionAssetKind {
  if (mimeType?.startsWith("image/")) {
    return "image";
  }

  if (mimeType?.startsWith("video/")) {
    return "video";
  }

  return "file";
}

export function buildSubmissionAssetPath(input: {
  campaignId: string;
  creatorId: string;
  submissionId: string;
  revisionNumber: number;
  fileName: string;
}) {
  const fileName = sanitizeFilename(input.fileName);
  const uniquePrefix = crypto.randomUUID();

  return [
    input.campaignId,
    input.creatorId,
    input.submissionId,
    `revision-${input.revisionNumber}`,
    `${uniquePrefix}-${fileName}`,
  ].join("/");
}

export async function getSignedSubmissionAssetUrls(paths: string[]) {
  const admin = createAdminClient();

  if (!admin || !paths.length) {
    return new Map<string, string | null>();
  }

  const uniquePaths = [...new Set(paths.filter(Boolean))];
  const results = await Promise.all(
    uniquePaths.map(async (path) => {
      const { data, error } = await admin.storage
        .from(SUBMISSION_ASSETS_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

      return [path, error ? null : data.signedUrl] as const;
    }),
  );

  return new Map<string, string | null>(results);
}
