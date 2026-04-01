import { NextResponse } from "next/server";
import { updateMetaCampaignStatus } from "@/lib/integrations/meta";
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
  { params }: { params: Promise<{ campaignId: string }> },
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

  const { campaignId } = await params;
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

  const { data: campaign } = await admin
    .from("brand_meta_campaigns")
    .select("meta_campaign_id, ad_account_id")
    .eq("brand_id", brand.brandId)
    .eq("meta_campaign_id", campaignId)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json(
      { error: "Meta campaign not found." },
      { status: 404 },
    );
  }

  try {
    await updateMetaCampaignStatus({
      accessToken: connection.access_token,
      campaignId,
      status,
    });

    await syncMetaCampaignRows({
      admin,
      brandId: brand.brandId,
      connection,
      adAccountId: campaign.ad_account_id ?? connection.ad_account_id,
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
      message: `Meta campaign moved to ${status.toLowerCase()}.`,
    });
  } catch (error) {
    await admin
      .from("brand_meta_connections")
      .update({
        status: "error",
        last_error:
          error instanceof Error
            ? error.message
            : "Unable to update Meta campaign.",
      })
      .eq("id", connection.id);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update Meta campaign.",
      },
      { status: 400 },
    );
  }
}
