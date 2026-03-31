import { NextResponse } from "next/server";
import {
  buildMetaAuthUrl,
  getMetaRedirectUri,
  getRequestOrigin,
  normalizeReturnTo,
} from "@/lib/integrations/meta";
import { requireBrandUser } from "@/lib/integrations/meta-connections";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const brand = await requireBrandUser();

  if ("error" in brand) {
    return brand.error;
  }

  try {
    const requestUrl = new URL(request.url);
    const returnTo = normalizeReturnTo(requestUrl.searchParams.get("returnTo"));
    const origin = getRequestOrigin(request);
    const redirectUri = getMetaRedirectUri(origin);
    const authUrl = buildMetaAuthUrl({
      redirectUri,
      state: returnTo,
    });

    return NextResponse.redirect(authUrl);
  } catch (error) {
    const fallbackUrl = new URL("/dashboard/integrations", request.url);
    fallbackUrl.searchParams.set(
      "meta_error",
      error instanceof Error ? error.message : "Unable to start Meta onboarding.",
    );

    return NextResponse.redirect(fallbackUrl);
  }
}
