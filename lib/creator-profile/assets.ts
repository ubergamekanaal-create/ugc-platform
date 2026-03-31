import { createAdminClient } from "@/lib/supabase/admin";
import type { SubmissionAssetKind } from "@/lib/types";

export const CREATOR_PORTFOLIO_ASSETS_BUCKET = "creator-portfolio-assets";
export const MAX_CREATOR_PORTFOLIO_FILES = 12;
export const MAX_CREATOR_PORTFOLIO_FILE_BYTES = 25 * 1024 * 1024;
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

export function getCreatorPortfolioAssetKind(
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

export function buildCreatorPortfolioAssetPath(input: {
  userId: string;
  fileName: string;
}) {
  const fileName = sanitizeFilename(input.fileName);
  const uniquePrefix = crypto.randomUUID();

  return [input.userId, `${uniquePrefix}-${fileName}`].join("/");
}

export async function getSignedCreatorPortfolioAssetUrls(paths: string[]) {
  const admin = createAdminClient();

  if (!admin || !paths.length) {
    return new Map<string, string | null>();
  }

  const uniquePaths = [...new Set(paths.filter(Boolean))];
  const results = await Promise.all(
    uniquePaths.map(async (path) => {
      const { data, error } = await admin.storage
        .from(CREATOR_PORTFOLIO_ASSETS_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

      return [path, error ? null : data.signedUrl] as const;
    }),
  );

  return new Map<string, string | null>(results);
}
