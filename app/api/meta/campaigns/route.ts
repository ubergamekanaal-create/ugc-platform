import { NextResponse } from "next/server";
import { buildTrackedUrl } from "@/lib/analytics/tracking";
import {
  createMetaAd,
  createMetaAdSet,
  createMetaCampaign,
  createMetaImageAdCreative,
  createMetaVideoAdCreative,
  uploadMetaVideoFromUrl,
} from "@/lib/integrations/meta";
import {
  readMetaPayload,
  requireBrandUser,
  syncMetaCampaignRows,
  type MetaConnectionRow,
} from "@/lib/integrations/meta-connections";
import {
  getSignedSubmissionAssetUrls,
  getSubmissionAssetKind,
} from "@/lib/submissions/assets";
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

function readBudget(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeCountries(value: unknown) {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return [...new Set(
    list
      .map((country) => (typeof country === "string" ? country.trim().toUpperCase() : ""))
      .filter((country) => /^[A-Z]{2}$/.test(country)),
  )];
}

function inferRemoteAssetKind(url: string) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();

    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(pathname)) {
      return "image";
    }

    if (/\.(mp4|mov|m4v|webm|avi)$/.test(pathname)) {
      return "video";
    }
  } catch {
    return null;
  }

  return null;
}

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
        sourceSubmissionId?: string | null;
        destinationUrl?: string | null;
        trackingUrl?: string | null;
        utmSource?: string | null;
        utmMedium?: string | null;
        utmCampaign?: string | null;
        utmContent?: string | null;
        utmTerm?: string | null;
        pageId?: string | null;
        adSetName?: string | null;
        adName?: string | null;
        dailyBudget?: number | string | null;
        countries?: string[] | string | null;
        creativeSourceKey?: string | null;
        primaryText?: string | null;
        headline?: string | null;
        description?: string | null;
        callToActionType?: string | null;
      }
    | null;
  const name = body?.name?.trim() ?? "";
  const objective = body?.objective?.trim() ?? "";
  const status = body?.status === "ACTIVE" ? "ACTIVE" : "PAUSED";
  const sourceSubmissionId = body?.sourceSubmissionId?.trim() || null;
  const destinationUrl = body?.destinationUrl?.trim() || null;
  const trackingUrl = body?.trackingUrl?.trim() || null;
  const utmSource = body?.utmSource?.trim() || null;
  const utmMedium = body?.utmMedium?.trim() || null;
  const utmCampaign = body?.utmCampaign?.trim() || null;
  const utmContent = body?.utmContent?.trim() || null;
  const utmTerm = body?.utmTerm?.trim() || null;
  const pageId = body?.pageId?.trim() || null;
  const adSetName = body?.adSetName?.trim() || null;
  const adName = body?.adName?.trim() || null;
  const dailyBudget = readBudget(body?.dailyBudget);
  const countries = normalizeCountries(body?.countries);
  const creativeSourceKey = body?.creativeSourceKey?.trim() || null;
  const primaryText = body?.primaryText?.trim() || null;
  const headline = body?.headline?.trim() || null;
  const description = body?.description?.trim() || null;
  const callToActionType = body?.callToActionType?.trim() || "LEARN_MORE";
  const wantsAdExecution = Boolean(
    pageId ||
      adSetName ||
      adName ||
      dailyBudget !== null ||
      creativeSourceKey ||
      primaryText ||
      headline ||
      description,
  );

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

  const selectedMetaAdAccountId = connection.ad_account_id;

  let sourceSubmission: {
    id: string;
    campaign_id: string;
    status: string;
    content_links: string[];
  } | null = null;

  if (sourceSubmissionId) {
    const { data: rawSubmission } = await admin
      .from("campaign_submissions")
      .select("id, campaign_id, status, content_links")
      .eq("id", sourceSubmissionId)
      .eq("brand_id", brand.brandId)
      .maybeSingle();

    if (!rawSubmission) {
      return NextResponse.json(
        { error: "Select a valid approved submission first." },
        { status: 404 },
      );
    }

    sourceSubmission = rawSubmission as {
      id: string;
      campaign_id: string;
      status: string;
      content_links: string[];
    };

    if (sourceSubmission?.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved submissions can be used for ads." },
        { status: 400 },
      );
    }
  }

  if (wantsAdExecution) {
    if (objective !== "OUTCOME_TRAFFIC") {
      return NextResponse.json(
        {
          error:
            "Full ad launch currently supports Traffic objective campaigns. Create the campaign with Traffic to launch an ad from CIRCL.",
        },
        { status: 400 },
      );
    }

    if (!sourceSubmission) {
      return NextResponse.json(
        { error: "Select an approved submission before creating an ad execution." },
        { status: 400 },
      );
    }

    if (!destinationUrl) {
      return NextResponse.json(
        { error: "Destination URL is required to create an ad execution." },
        { status: 400 },
      );
    }

    if (!pageId) {
      return NextResponse.json(
        { error: "Meta Page ID is required to create an ad creative." },
        { status: 400 },
      );
    }

    if (!creativeSourceKey) {
      return NextResponse.json(
        { error: "Select a creator asset or content link to use in the ad." },
        { status: 400 },
      );
    }

    if (dailyBudget === null || dailyBudget <= 0) {
      return NextResponse.json(
        { error: "Enter a daily budget greater than 0 to create the ad set." },
        { status: 400 },
      );
    }
  }

  try {
    const metaCampaignId = await createMetaCampaign({
      accessToken: connection.access_token,
      adAccountId: selectedMetaAdAccountId,
      name,
      objective,
      status,
    });
    const resolvedTrackingUrl = destinationUrl
      ? buildTrackedUrl({
          destinationUrl,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,
          campaignId: sourceSubmission?.campaign_id ?? null,
          submissionId: sourceSubmissionId,
          metaCampaignId,
        })
      : trackingUrl;

    const { data: trackedCampaign, error: trackingError } = await admin
      .from("brand_meta_campaigns")
      .upsert(
        {
            connection_id: connection.id,
            brand_id: brand.brandId,
            ad_account_id: selectedMetaAdAccountId,
          meta_campaign_id: metaCampaignId,
          source_submission_id: sourceSubmissionId,
          destination_url: destinationUrl,
          tracking_url: resolvedTrackingUrl,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          utm_term: utmTerm,
          name,
          objective,
          status,
          effective_status: status,
          raw_payload: {},
          synced_at: new Date().toISOString(),
        },
        {
          onConflict: "meta_campaign_id",
        },
      )
      .select(
        "id, connection_id, brand_id, ad_account_id, meta_campaign_id, source_submission_id, destination_url, tracking_url, utm_source, utm_medium, utm_campaign, utm_content, utm_term, name, objective, status, effective_status, daily_budget, lifetime_budget, spend, impressions, clicks, ctr, cpc, cpm, synced_at, created_at, updated_at",
      )
      .single();

    if (trackingError || !trackedCampaign) {
      throw new Error(
        trackingError?.message ?? "Unable to save the Meta campaign tracking row.",
      );
    }

    if (wantsAdExecution && sourceSubmission) {
      const selectedCreativeSourceKey = creativeSourceKey!;
      const finalPageId = pageId!;
      const finalTrackingUrl = resolvedTrackingUrl || destinationUrl!;
      let selectedAssetId: string | null = null;
      let sourceAssetKind: "image" | "video" | null = null;
      let sourceAssetUrl: string | null = null;

      if (selectedCreativeSourceKey.startsWith("asset:")) {
        const assetId = selectedCreativeSourceKey.slice("asset:".length);
        const { data: rawAsset } = await admin
          .from("campaign_submission_assets")
          .select("id, submission_id, file_name, storage_path, mime_type")
          .eq("id", assetId)
          .eq("submission_id", sourceSubmission.id)
          .maybeSingle();

        if (!rawAsset) {
          throw new Error("The selected submission asset could not be found.");
        }

        selectedAssetId = rawAsset.id as string;
        const assetKind = getSubmissionAssetKind(rawAsset.mime_type as string | null);

        if (assetKind !== "image" && assetKind !== "video") {
          throw new Error("Only image and video submission assets can be used in Meta ads.");
        }

        sourceAssetKind = assetKind;

        const signedUrlMap = await getSignedSubmissionAssetUrls([
          rawAsset.storage_path as string,
        ]);

        sourceAssetUrl = signedUrlMap.get(rawAsset.storage_path as string) ?? null;
      } else if (selectedCreativeSourceKey.startsWith("link:")) {
        const linkIndex = Number(selectedCreativeSourceKey.slice("link:".length));
        const linkValue =
          Number.isInteger(linkIndex) && linkIndex >= 0
            ? sourceSubmission.content_links[linkIndex] ?? null
            : null;

        if (!linkValue) {
          throw new Error("The selected content link could not be resolved.");
        }

        sourceAssetUrl = linkValue;
        sourceAssetKind = inferRemoteAssetKind(linkValue);

        if (!sourceAssetKind) {
          throw new Error(
            "Content links used for ads must be direct image or video URLs.",
          );
        }
      } else {
        throw new Error("Unsupported creative source selected.");
      }

      if (!sourceAssetUrl || !sourceAssetKind) {
        throw new Error("Unable to resolve the source asset for this ad.");
      }

      const finalAdSetName = adSetName || `${name} Ad Set`;
      const finalAdName = adName || `${name} Ad`;
      const finalHeadline = headline || name;
      const finalPrimaryText = primaryText || `${name} from CIRCL creator content`;
      const targetingCountries = countries.length ? countries : ["US"];
      const dailyBudgetMinorUnits = Math.round(dailyBudget! * 100);

      const metaAdSetId = await createMetaAdSet({
        accessToken: connection.access_token,
        adAccountId: selectedMetaAdAccountId,
        campaignId: metaCampaignId,
        name: finalAdSetName,
        status,
        dailyBudgetMinorUnits,
        countries: targetingCountries,
      });

      const metaCreativeId =
        sourceAssetKind === "video"
          ? await (async () => {
              const videoId = await uploadMetaVideoFromUrl({
                accessToken: connection.access_token,
                adAccountId: selectedMetaAdAccountId,
                name: `${finalAdName} Video`,
                videoUrl: sourceAssetUrl!,
              });

              return createMetaVideoAdCreative({
                accessToken: connection.access_token,
                adAccountId: selectedMetaAdAccountId,
                name: `${finalAdName} Creative`,
                pageId: finalPageId,
                linkUrl: finalTrackingUrl,
                videoId,
                headline: finalHeadline,
                message: finalPrimaryText,
                description,
                callToActionType,
              });
            })()
          : await createMetaImageAdCreative({
              accessToken: connection.access_token,
              adAccountId: selectedMetaAdAccountId,
              name: `${finalAdName} Creative`,
              pageId: finalPageId,
              linkUrl: finalTrackingUrl,
              imageUrl: sourceAssetUrl,
              headline: finalHeadline,
              message: finalPrimaryText,
              description,
              callToActionType,
            });

      const metaAdId = await createMetaAd({
        accessToken: connection.access_token,
        adAccountId: selectedMetaAdAccountId,
        adSetId: metaAdSetId,
        creativeId: metaCreativeId,
        name: finalAdName,
        status,
      });

      const { data: localAdSet, error: adSetError } = await admin
        .from("brand_meta_ad_sets")
        .upsert(
          {
            connection_id: connection.id,
            campaign_id: trackedCampaign.id,
            brand_id: brand.brandId,
            source_submission_id: sourceSubmission.id,
            meta_campaign_id: metaCampaignId,
            meta_ad_set_id: metaAdSetId,
            name: finalAdSetName,
            status,
            effective_status: status,
            destination_type: "WEBSITE",
            billing_event: "IMPRESSIONS",
            optimization_goal: "LINK_CLICKS",
            daily_budget: dailyBudgetMinorUnits,
            targeting_countries: targetingCountries,
            raw_payload: {},
            synced_at: new Date().toISOString(),
          },
          {
            onConflict: "meta_ad_set_id",
          },
        )
        .select("id")
        .single();

      if (adSetError || !localAdSet) {
        throw new Error(adSetError?.message ?? "Unable to save the Meta ad set.");
      }

      const { error: adError } = await admin.from("brand_meta_ads").upsert(
        {
          connection_id: connection.id,
          campaign_id: trackedCampaign.id,
          ad_set_id: localAdSet.id,
          brand_id: brand.brandId,
          source_submission_id: sourceSubmission.id,
          selected_asset_id: selectedAssetId,
          meta_campaign_id: metaCampaignId,
          meta_ad_set_id: metaAdSetId,
          meta_ad_id: metaAdId,
          meta_creative_id: metaCreativeId,
          name: finalAdName,
          status,
          effective_status: status,
          page_id: finalPageId,
          source_asset_kind: sourceAssetKind,
          source_asset_url: sourceAssetUrl,
          destination_url: destinationUrl,
          tracking_url: finalTrackingUrl,
          primary_text: finalPrimaryText,
          headline: finalHeadline,
          description,
          call_to_action_type: callToActionType,
          raw_payload: {},
          synced_at: new Date().toISOString(),
        },
        {
          onConflict: "meta_ad_id",
        },
      );

      if (adError) {
        throw new Error(adError.message);
      }
    }

    await syncMetaCampaignRows({
      admin,
      brandId: brand.brandId,
      connection,
      adAccountId: selectedMetaAdAccountId,
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
      message: wantsAdExecution
        ? `Meta campaign "${name}" and its first ad were created.`
        : `Meta campaign "${name}" created.`,
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
