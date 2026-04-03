import { NextResponse } from "next/server";
import { updateMetaAdStatus } from "@/lib/integrations/meta";
import {
  readMetaPayload,
  requireBrandUser,
  syncMetaCampaignRows,
  type MetaConnectionRow,
} from "@/lib/integrations/meta-connections";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ adId: string }> },
) {
  const brand = await requireBrandUser();

  if ("error" in brand) {
    return brand.error;
  }

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }

  const { adId } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        status?: string;
      }
    | null;
  const status = body?.status === "ACTIVE" ? "ACTIVE" : "PAUSED";

  const { data: rawConnection } = await admin
    .from("brand_meta_connections")
    .select(
      "id, brand_id, meta_user_id, meta_user_name, business_id, business_name, ad_account_id, ad_account_name, access_token, token_expires_at, permissions, status, last_error, connected_at, last_synced_at",
    )
    .eq("brand_id", brand.brandId)
    .maybeSingle();

  const connection = rawConnection as MetaConnectionRow | null;

  if (!connection || !connection.ad_account_id) {
    return NextResponse.json(
      { error: "Connect Meta and select an ad account first." },
      { status: 400 },
    );
  }

  const { data: ad } = await admin
    .from("brand_meta_ads")
    .select("campaign_id, meta_campaign_id")
    .eq("brand_id", brand.brandId)
    .eq("meta_ad_id", adId)
    .maybeSingle();

  if (!ad) {
    return NextResponse.json(
      { error: "Meta ad not found." },
      { status: 404 },
    );
  }

  const { data: campaign } = await admin
    .from("brand_meta_campaigns")
    .select("ad_account_id")
    .eq("brand_id", brand.brandId)
    .eq("id", ad.campaign_id)
    .maybeSingle();

  const adAccountId = campaign?.ad_account_id ?? connection.ad_account_id;

  try {
    await updateMetaAdStatus({
      accessToken: connection.access_token,
      adId,
      status,
    });

    await syncMetaCampaignRows({
      admin,
      brandId: brand.brandId,
      connection,
      adAccountId,
    });

    await admin
      .from("brand_meta_connections")
      .update({
        status: "connected",
        last_error: null,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    const payload = await readMetaPayload(admin, brand.brandId);

    return NextResponse.json({
      ...payload,
      message: `Meta ad moved to ${status.toLowerCase()}.`,
    });
  } catch (error) {
    await admin
      .from("brand_meta_connections")
      .update({
        status: "error",
        last_error:
          error instanceof Error ? error.message : "Unable to update Meta ad.",
      })
      .eq("id", connection.id);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update Meta ad.",
      },
      { status: 400 },
    );
  }
}
