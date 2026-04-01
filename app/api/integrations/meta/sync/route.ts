import { NextResponse } from "next/server";
import {
  fetchMetaAdAccounts,
} from "@/lib/integrations/meta";
import {
  readMetaPayload,
  requireBrandUser,
  syncAllMetaCampaignRows,
  upsertMetaAdAccounts,
  type MetaConnectionRow,
} from "@/lib/integrations/meta-connections";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST() {
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

  const { data: rawConnection } = await admin
    .from("brand_meta_connections")
    .select(
      "id, brand_id, meta_user_id, meta_user_name, business_id, business_name, ad_account_id, ad_account_name, access_token, token_expires_at, permissions, status, last_error, connected_at, last_synced_at",
    )
    .eq("brand_id", brand.brandId)
    .maybeSingle();

  const connection = rawConnection as MetaConnectionRow | null;

  if (!connection) {
    return NextResponse.json(
      { error: "Connect Meta first." },
      { status: 404 },
    );
  }

  try {
    const adAccounts = await fetchMetaAdAccounts(connection.access_token);
    const selectedAccount =
      adAccounts.find((account) => account.id === connection.ad_account_id) ??
      adAccounts[0] ??
      null;

    await upsertMetaAdAccounts({
      admin,
      connectionId: connection.id,
      brandId: brand.brandId,
      adAccounts,
      selectedAccountId: selectedAccount?.id ?? null,
    });

    if (!selectedAccount) {
      const { error: updateError } = await admin
        .from("brand_meta_connections")
        .update({
          status: "pending",
          last_error: "No Meta ad accounts were returned for this connection.",
        })
        .eq("id", connection.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const payload = await readMetaPayload(admin, brand.brandId);

      return NextResponse.json({
        ...payload,
        message:
          "Meta connected, but no ad accounts are available yet. Grant ads access or select a different Meta user.",
      });
    }

    await syncAllMetaCampaignRows({
      admin,
      brandId: brand.brandId,
      connection,
      adAccounts,
      selectedAccountId: selectedAccount.id,
    });

    const payload = await readMetaPayload(admin, brand.brandId);

    return NextResponse.json({
      ...payload,
      message: `Meta campaigns synced from ${selectedAccount.name}.`,
    });
  } catch (error) {
    await admin
      .from("brand_meta_connections")
      .update({
        status: "error",
        last_error:
          error instanceof Error ? error.message : "Unable to sync Meta campaigns.",
      })
      .eq("id", connection.id);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to sync Meta campaigns.",
      },
      { status: 400 },
    );
  }
}
