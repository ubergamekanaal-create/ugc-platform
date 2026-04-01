import { NextResponse } from "next/server";
import {
  readMetaPayload,
  requireBrandUser,
  type MetaConnectionRow,
} from "@/lib/integrations/meta-connections";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const payload = await readMetaPayload(admin, brand.brandId);
  return NextResponse.json(payload);
}

export async function PATCH(request: Request) {
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
        adAccountId?: string;
      }
    | null;
  const adAccountId = body?.adAccountId?.trim() ?? "";

  if (!adAccountId) {
    return NextResponse.json(
      { error: "Select an ad account first." },
      { status: 400 },
    );
  }

  const { data: connection } = await admin
    .from("brand_meta_connections")
    .select(
      "id, brand_id, meta_user_id, meta_user_name, business_id, business_name, ad_account_id, ad_account_name, access_token, token_expires_at, permissions, status, last_error, connected_at, last_synced_at",
    )
    .eq("brand_id", brand.brandId)
    .maybeSingle();

  if (!connection) {
    return NextResponse.json(
      { error: "Connect Meta first." },
      { status: 404 },
    );
  }

  const { data: account } = await admin
    .from("brand_meta_ad_accounts")
    .select(
      "id, connection_id, brand_id, meta_account_id, account_name, account_status, currency, business_id, business_name, is_selected, created_at, updated_at",
    )
    .eq("brand_id", brand.brandId)
    .eq("meta_account_id", adAccountId)
    .maybeSingle();

  if (!account) {
    return NextResponse.json(
      { error: "That ad account is not available on this Meta connection." },
      { status: 404 },
    );
  }

  await admin
    .from("brand_meta_ad_accounts")
    .update({ is_selected: false })
    .eq("brand_id", brand.brandId);

  const { error: accountUpdateError } = await admin
    .from("brand_meta_ad_accounts")
    .update({ is_selected: true })
    .eq("id", account.id);

  if (accountUpdateError) {
    return NextResponse.json(
      { error: accountUpdateError.message },
      { status: 400 },
    );
  }

  const { error: connectionUpdateError } = await admin
    .from("brand_meta_connections")
    .update({
      ad_account_id: account.meta_account_id,
      ad_account_name: account.account_name,
      business_id: account.business_id,
      business_name: account.business_name,
      last_error: null,
    })
    .eq("id", connection.id);

  if (connectionUpdateError) {
    return NextResponse.json(
      { error: connectionUpdateError.message },
      { status: 400 },
    );
  }

  const payload = await readMetaPayload(admin, brand.brandId);

  return NextResponse.json({
    ...payload,
    message: `Default Meta ad account set to ${account.account_name}.`,
  });
}

export async function DELETE() {
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

  const { error } = await admin
    .from("brand_meta_connections")
    .delete()
    .eq("brand_id", brand.brandId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    connection: null,
    adAccounts: [],
    campaigns: [],
    message: "Meta connection removed.",
  });
}
