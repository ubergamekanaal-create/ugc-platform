import { NextResponse } from "next/server";
import { createMetaCampaign } from "@/lib/integrations/meta";
import {
  readMetaPayload,
  requireBrandUser,
  syncMetaCampaignRows,
  type MetaConnectionRow,
} from "@/lib/integrations/meta-connections";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const allowedObjectives = new Set([
  "OUTCOME_AWARENESS",
  "OUTCOME_TRAFFIC",
  "OUTCOME_ENGAGEMENT",
  "OUTCOME_LEADS",
  "OUTCOME_APP_PROMOTION",
  "OUTCOME_SALES",
]);

export async function POST(request: Request) {
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

  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        objective?: string;
        status?: string;
      }
    | null;
  const name = body?.name?.trim() ?? "";
  const objective = body?.objective?.trim() ?? "";
  const status = body?.status === "ACTIVE" ? "ACTIVE" : "PAUSED";

  if (!name) {
    return NextResponse.json(
      { error: "Campaign name is required." },
      { status: 400 },
    );
  }

  if (!allowedObjectives.has(objective)) {
    return NextResponse.json(
      { error: "Select a supported Meta campaign objective." },
      { status: 400 },
    );
  }

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

  try {
    await createMetaCampaign({
      accessToken: connection.access_token,
      adAccountId: connection.ad_account_id,
      name,
      objective,
      status,
    });

    await syncMetaCampaignRows({
      admin,
      brandId: brand.brandId,
      connection,
      adAccountId: connection.ad_account_id,
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
      message: `Meta campaign "${name}" created.`,
    });
  } catch (error) {
    await admin
      .from("brand_meta_connections")
      .update({
        status: "error",
        last_error:
          error instanceof Error ? error.message : "Unable to create Meta campaign.",
      })
      .eq("id", connection.id);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create Meta campaign.",
      },
      { status: 400 },
    );
  }
}
