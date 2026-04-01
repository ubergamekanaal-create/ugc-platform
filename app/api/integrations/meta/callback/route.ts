import { NextResponse } from "next/server";
import {
  exchangeMetaCodeForAccessToken,
  fetchMetaAdAccounts,
  fetchMetaUser,
  getMetaRedirectUri,
  getRequestOrigin,
  normalizeReturnTo,
} from "@/lib/integrations/meta";
import {
  syncAllMetaCampaignRows,
  upsertMetaAdAccounts,
} from "@/lib/integrations/meta-connections";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function buildRedirectUrl(request: Request, returnTo: string, key: string, value: string) {
  const origin = getRequestOrigin(request);
  const redirectUrl = new URL(returnTo, origin);
  redirectUrl.searchParams.set(key, value);
  return redirectUrl;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = normalizeReturnTo(requestUrl.searchParams.get("state"));
  const code = requestUrl.searchParams.get("code");
  const metaError = requestUrl.searchParams.get("error_message");

  if (metaError) {
    return NextResponse.redirect(
      buildRedirectUrl(request, returnTo, "meta_error", metaError),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        returnTo,
        "meta_error",
        "Meta did not return an authorization code.",
      ),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        "/login",
        "meta_error",
        "Log in as a brand account before connecting Meta.",
      ),
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "brand") {
    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        returnTo,
        "meta_error",
        "Only brand accounts can connect Meta.",
      ),
    );
  }

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        returnTo,
        "meta_error",
        "Missing SUPABASE_SERVICE_ROLE_KEY.",
      ),
    );
  }

  try {
    const origin = getRequestOrigin(request);
    const redirectUri = getMetaRedirectUri(origin);
    const token = await exchangeMetaCodeForAccessToken({
      code,
      redirectUri,
    });
    const metaUser = await fetchMetaUser(token.accessToken);
    const adAccounts = await fetchMetaAdAccounts(token.accessToken);
    const selectedAccount = adAccounts[0] ?? null;
    const tokenExpiresAt = token.expiresIn
      ? new Date(Date.now() + token.expiresIn * 1000).toISOString()
      : null;

    const { data: connection, error: connectionError } = await admin
      .from("brand_meta_connections")
      .upsert(
        {
          brand_id: user.id,
          meta_user_id: metaUser.id,
          meta_user_name: metaUser.name,
          business_id: selectedAccount?.business_id ?? null,
          business_name: selectedAccount?.business_name ?? null,
          ad_account_id: selectedAccount?.id ?? null,
          ad_account_name: selectedAccount?.name ?? null,
          access_token: token.accessToken,
          token_expires_at: tokenExpiresAt,
          permissions: ["ads_management", "ads_read", "business_management"],
          status: selectedAccount ? "connected" : "pending",
          last_error: null,
          last_synced_at: null,
        },
        { onConflict: "brand_id" },
      )
      .select(
        "id, brand_id, meta_user_id, meta_user_name, business_id, business_name, ad_account_id, ad_account_name, access_token, token_expires_at, permissions, status, last_error, connected_at, last_synced_at",
      )
      .single();

    if (connectionError || !connection) {
      throw new Error(connectionError?.message ?? "Unable to save Meta connection.");
    }

    await upsertMetaAdAccounts({
      admin,
      connectionId: connection.id,
      brandId: user.id,
      adAccounts,
      selectedAccountId: selectedAccount?.id ?? null,
    });

    await syncAllMetaCampaignRows({
      admin,
      brandId: user.id,
      connection,
      adAccounts,
      selectedAccountId: selectedAccount?.id ?? null,
    });

    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        returnTo,
        "meta",
        selectedAccount ? "connected" : "account_required",
      ),
    );
  } catch (error) {
    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        returnTo,
        "meta_error",
        error instanceof Error ? error.message : "Unable to connect Meta.",
      ),
    );
  }
}
