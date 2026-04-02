"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MotionScale } from "@/components/shared/motion";
import {
  buildTrackedUrl,
  slugifyTrackingValue,
} from "@/lib/analytics/tracking";
import type {
  BrandMetaAdAccountSummary,
  BrandMetaAdSetSummary,
  BrandMetaAdSummary,
  BrandMetaCampaignSummary,
  BrandMetaConnectionSummary,
  BrandStoreAnalyticsSettings,
  BrandSubmissionSummary,
} from "@/lib/types";
import {
  cn,
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatPercent,
} from "@/lib/utils";

type BrandMetaPanelProps = {
  mode: "integrations" | "ads";
  approvedSubmissions?: BrandSubmissionSummary[];
};

type MetaIntegrationResponse = {
  connection: BrandMetaConnectionSummary | null;
  adAccounts: BrandMetaAdAccountSummary[];
  campaigns: BrandMetaCampaignSummary[];
  adSets: BrandMetaAdSetSummary[];
  ads: BrandMetaAdSummary[];
  message?: string;
  error?: string;
};

type StoreAnalyticsResponse = {
  settings: BrandStoreAnalyticsSettings | null;
};

const objectiveOptions = [
  { value: "OUTCOME_AWARENESS", label: "Awareness" },
  { value: "OUTCOME_TRAFFIC", label: "Traffic" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement" },
  { value: "OUTCOME_LEADS", label: "Leads" },
  { value: "OUTCOME_APP_PROMOTION", label: "App Promotion" },
  { value: "OUTCOME_SALES", label: "Sales" },
];

const callToActionOptions = [
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "APPLY_NOW", label: "Apply Now" },
];

const submissionFilterAllValue = "__all__";
const submissionFilterUnlinkedValue = "__unlinked__";

function formatMetaStatus(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function getMetaStatusClasses(value: string | null | undefined) {
  const normalized = value?.toLowerCase();

  if (normalized === "active" || normalized === "connected") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalized === "paused" || normalized === "pending") {
    return "bg-amber-50 text-amber-700";
  }

  if (normalized === "error" || normalized === "archived") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-slate-100 text-slate-600";
}

function matchesSubmissionFilter(
  sourceSubmissionId: string | null | undefined,
  filterValue: string,
) {
  if (filterValue === submissionFilterAllValue) {
    return true;
  }

  if (filterValue === submissionFilterUnlinkedValue) {
    return !sourceSubmissionId;
  }

  return sourceSubmissionId === filterValue;
}

export function BrandMetaPanel({
  mode,
  approvedSubmissions = [],
}: BrandMetaPanelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [connection, setConnection] =
    useState<BrandMetaConnectionSummary | null>(null);
  const [adAccounts, setAdAccounts] = useState<BrandMetaAdAccountSummary[]>([]);
  const [campaigns, setCampaigns] = useState<BrandMetaCampaignSummary[]>([]);
  const [adSets, setAdSets] = useState<BrandMetaAdSetSummary[]>([]);
  const [ads, setAds] = useState<BrandMetaAdSummary[]>([]);
  const [analyticsSettings, setAnalyticsSettings] =
    useState<BrandStoreAnalyticsSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
  const [pendingResourceKey, setPendingResourceKey] = useState<string | null>(null);
  const [submissionFilter, setSubmissionFilter] = useState(
    submissionFilterAllValue,
  );
  const hasAutoSyncedRef = useRef(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    objective: objectiveOptions[1]?.value ?? "OUTCOME_TRAFFIC",
    status: "PAUSED",
    sourceSubmissionId: "",
    destinationUrl: "",
    utmSource: "circl",
    utmMedium: "paid_social",
    utmCampaign: "",
    utmContent: "",
    utmTerm: "",
    pageId: "",
    adSetName: "",
    adName: "",
    dailyBudget: "",
    countries: "US",
    creativeSourceKey: "",
    primaryText: "",
    headline: "",
    description: "",
    callToActionType: callToActionOptions[0]?.value ?? "LEARN_MORE",
  });

  useEffect(() => {
    void (async () => {
      setIsLoading(true);

      try {
        const [metaResponse, analyticsResponse] = await Promise.all([
          fetch("/api/integrations/meta", {
            cache: "no-store",
          }),
          mode === "ads"
            ? fetch("/api/integrations/store/analytics", {
                cache: "no-store",
              })
            : Promise.resolve(null),
        ]);
        const payload = (await metaResponse.json()) as MetaIntegrationResponse;

        if (!metaResponse.ok) {
          throw new Error(payload.error ?? "Unable to load Meta integration.");
        }

        setConnection(payload.connection);
        setAdAccounts(payload.adAccounts);
        setCampaigns(payload.campaigns);
        setAdSets(payload.adSets);
        setAds(payload.ads);

        if (analyticsResponse) {
          const analyticsPayload =
            (await analyticsResponse.json()) as StoreAnalyticsResponse;

          if (analyticsResponse.ok) {
            setAnalyticsSettings(analyticsPayload.settings);
            setCampaignForm((current) => ({
              ...current,
              utmSource:
                current.utmSource ||
                analyticsPayload.settings?.utm_source_default ||
                "circl",
              utmMedium:
                current.utmMedium ||
                analyticsPayload.settings?.utm_medium_default ||
                "paid_social",
              utmTerm:
                current.utmTerm ||
                analyticsPayload.settings?.utm_term_default ||
                "",
            }));
          }
        }

        if (mode === "ads" && payload.connection && !hasAutoSyncedRef.current) {
          hasAutoSyncedRef.current = true;
          setIsSyncing(true);

          try {
            const syncResponse = await fetch("/api/integrations/meta/sync", {
              method: "POST",
            });
            const syncPayload = (await syncResponse.json()) as MetaIntegrationResponse;

            if (!syncResponse.ok) {
              throw new Error(syncPayload.error ?? "Unable to sync Meta campaigns.");
            }

            setConnection(syncPayload.connection);
            setAdAccounts(syncPayload.adAccounts);
            setCampaigns(syncPayload.campaigns);
            setAdSets(syncPayload.adSets);
            setAds(syncPayload.ads);
            setMessage(syncPayload.message ?? null);
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Unable to sync Meta campaigns.",
            );
          } finally {
            setIsSyncing(false);
          }
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load Meta integration.",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [mode]);

  useEffect(() => {
    const metaStatus = searchParams.get("meta");
    const metaError = searchParams.get("meta_error");

    if (metaError) {
      setMessage(metaError);
      return;
    }

    if (metaStatus === "connected") {
      setMessage("Meta account connected.");
    } else if (metaStatus === "account_required") {
      setMessage(
        "Meta connected, but no ad account was selected automatically. Pick one below.",
      );
    }
  }, [searchParams]);

  const selectedAdAccount =
    adAccounts.find((account) => account.is_selected) ??
    (connection?.ad_account_id
      ? adAccounts.find((account) => account.meta_account_id === connection.ad_account_id) ??
        null
      : null);

  const recentCampaigns = useMemo(() => campaigns.slice(0, 6), [campaigns]);
  const approvedSubmissionById = useMemo(
    () =>
      new Map(
        approvedSubmissions.map((submission) => [submission.id, submission] as const),
      ),
    [approvedSubmissions],
  );
  const selectedSubmission =
    approvedSubmissionById.get(campaignForm.sourceSubmissionId) ?? null;
  const creativeSourceOptions = useMemo(() => {
    if (!selectedSubmission) {
      return [];
    }

    const assetOptions = selectedSubmission.assets
      .filter((asset) => asset.kind === "image" || asset.kind === "video")
      .map((asset) => ({
        key: `asset:${asset.id}`,
        label: `${asset.kind === "video" ? "Video" : "Image"} asset • ${asset.file_name}`,
        hint: `Revision ${asset.revision_number}`,
      }));

    const linkOptions = selectedSubmission.content_links.map((link, index) => ({
      key: `link:${index}`,
      label: `Content link ${index + 1}`,
      hint: link,
    }));

    return [...assetOptions, ...linkOptions];
  }, [selectedSubmission]);
  const trackingUrlPreview = buildTrackedUrl({
    destinationUrl: campaignForm.destinationUrl,
    utmSource: campaignForm.utmSource,
    utmMedium: campaignForm.utmMedium,
    utmCampaign: campaignForm.utmCampaign,
    utmContent: campaignForm.utmContent,
    utmTerm: campaignForm.utmTerm,
    campaignId: selectedSubmission?.campaign_id ?? null,
    submissionId: campaignForm.sourceSubmissionId || null,
  });
  const adAccountNameById = useMemo(
    () =>
      new Map(
        adAccounts.map((account) => [account.meta_account_id, account.account_name] as const),
      ),
    [adAccounts],
  );
  const selectedCreativeSourceOption =
    creativeSourceOptions.find(
      (option) => option.key === campaignForm.creativeSourceKey,
    ) ?? null;
  const executionIntent = Boolean(
    campaignForm.pageId ||
      campaignForm.adSetName ||
      campaignForm.adName ||
      campaignForm.dailyBudget ||
      campaignForm.creativeSourceKey ||
      campaignForm.primaryText ||
      campaignForm.headline ||
      campaignForm.description,
  );
  const adSetsByCampaignId = useMemo(
    () =>
      adSets.reduce((map, adSet) => {
        const existing = map.get(adSet.campaign_id) ?? [];
        existing.push(adSet);
        map.set(adSet.campaign_id, existing);
        return map;
      }, new Map<string, BrandMetaAdSetSummary[]>()),
    [adSets],
  );
  const adsByCampaignId = useMemo(
    () =>
      ads.reduce((map, ad) => {
        const existing = map.get(ad.campaign_id) ?? [];
        existing.push(ad);
        map.set(ad.campaign_id, existing);
        return map;
      }, new Map<string, BrandMetaAdSummary[]>()),
    [ads],
  );
  const submissionFilterOptions = useMemo(() => {
    const optionMap = new Map<
      string,
      {
        id: string;
        label: string;
        hint: string;
      }
    >();

    approvedSubmissions.forEach((submission) => {
      optionMap.set(submission.id, {
        id: submission.id,
        label: `${submission.creator_name} • ${submission.campaign_title}`,
        hint: submission.status,
      });
    });

    [...campaigns, ...adSets, ...ads].forEach((item) => {
      const submissionId = item.source_submission_id;

      if (!submissionId || optionMap.has(submissionId)) {
        return;
      }

      optionMap.set(submissionId, {
        id: submissionId,
        label: `Linked submission ${submissionId.slice(0, 8)}`,
        hint: "Submission details unavailable",
      });
    });

    return [...optionMap.values()].sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  }, [approvedSubmissions, campaigns, adSets, ads]);
  const selectedSubmissionFilterOption =
    submissionFilterOptions.find((option) => option.id === submissionFilter) ?? null;
  const reportingSubmission =
    submissionFilter !== submissionFilterAllValue &&
    submissionFilter !== submissionFilterUnlinkedValue
      ? approvedSubmissionById.get(submissionFilter) ?? null
      : null;
  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((campaign) => {
        if (matchesSubmissionFilter(campaign.source_submission_id, submissionFilter)) {
          return true;
        }

        if (submissionFilter === submissionFilterAllValue) {
          return true;
        }

        const linkedAdSets = adSetsByCampaignId.get(campaign.id) ?? [];
        const linkedAds = adsByCampaignId.get(campaign.id) ?? [];

        return (
          linkedAdSets.some((adSet) =>
            matchesSubmissionFilter(adSet.source_submission_id, submissionFilter),
          ) ||
          linkedAds.some((ad) =>
            matchesSubmissionFilter(ad.source_submission_id, submissionFilter),
          )
        );
      }),
    [campaigns, adSetsByCampaignId, adsByCampaignId, submissionFilter],
  );
  const filteredAdSets = useMemo(
    () =>
      adSets.filter((adSet) =>
        matchesSubmissionFilter(adSet.source_submission_id, submissionFilter),
      ),
    [adSets, submissionFilter],
  );
  const filteredAds = useMemo(
    () =>
      ads.filter((ad) => matchesSubmissionFilter(ad.source_submission_id, submissionFilter)),
    [ads, submissionFilter],
  );
  const campaignSpend = filteredCampaigns.reduce(
    (sum, campaign) => sum + campaign.spend,
    0,
  );
  const campaignClicks = filteredCampaigns.reduce(
    (sum, campaign) => sum + campaign.clicks,
    0,
  );
  const campaignImpressions = filteredCampaigns.reduce(
    (sum, campaign) => sum + campaign.impressions,
    0,
  );
  const totalAdSpend = filteredAds.reduce((sum, ad) => sum + ad.spend, 0);
  const totalAdClicks = filteredAds.reduce((sum, ad) => sum + ad.clicks, 0);
  const totalAdImpressions = filteredAds.reduce(
    (sum, ad) => sum + ad.impressions,
    0,
  );
  const campaignCtr = campaignImpressions
    ? (campaignClicks / campaignImpressions) * 100
    : filteredCampaigns.length
      ? filteredCampaigns.reduce((sum, campaign) => sum + campaign.ctr, 0) /
        filteredCampaigns.length
      : 0;
  const adCtr = totalAdImpressions ? (totalAdClicks / totalAdImpressions) * 100 : 0;
  const executionSpend = filteredAds.length
    ? totalAdSpend
    : filteredAdSets.reduce((sum, adSet) => sum + adSet.spend, 0);
  const executionClicks = filteredAds.length
    ? totalAdClicks
    : filteredAdSets.reduce((sum, adSet) => sum + adSet.clicks, 0);
  const executionImpressions = filteredAds.length
    ? totalAdImpressions
    : filteredAdSets.reduce((sum, adSet) => sum + adSet.impressions, 0);
  const scopeSpend =
    submissionFilter === submissionFilterAllValue ? campaignSpend : executionSpend || campaignSpend;
  const scopeCtr =
    submissionFilter === submissionFilterAllValue
      ? campaignCtr
      : executionImpressions
        ? (executionClicks / executionImpressions) * 100
        : campaignCtr;
  const scopeLabel =
    submissionFilter === submissionFilterAllValue
      ? "campaign"
      : filteredAds.length
        ? "ad"
        : filteredAdSets.length
          ? "ad set"
          : "campaign";
  const reportingScopeLabel =
    submissionFilter === submissionFilterAllValue
      ? "All creator-linked reporting"
      : submissionFilter === submissionFilterUnlinkedValue
        ? "Unlinked campaigns and ads"
        : selectedSubmissionFilterOption?.label ?? "Selected creator submission";
  const reportingScopeHint =
    submissionFilter === submissionFilterAllValue
      ? "Showing every synced campaign, ad set, and ad pulled from Meta."
      : submissionFilter === submissionFilterUnlinkedValue
        ? "Only execution without a linked approved submission is visible."
        : reportingSubmission
          ? `${reportingSubmission.creator_name} • ${reportingSubmission.campaign_title}`
          : selectedSubmissionFilterOption?.hint ?? "Only execution linked to this submission is visible.";

  useEffect(() => {
    if (
      submissionFilter === submissionFilterAllValue ||
      submissionFilter === submissionFilterUnlinkedValue
    ) {
      return;
    }

    if (!submissionFilterOptions.some((option) => option.id === submissionFilter)) {
      setSubmissionFilter(submissionFilterAllValue);
    }
  }, [submissionFilter, submissionFilterOptions]);

  function applyPayload(payload: MetaIntegrationResponse, fallbackMessage?: string) {
    setConnection(payload.connection);
    setAdAccounts(payload.adAccounts);
    setCampaigns(payload.campaigns);
    setAdSets(payload.adSets);
    setAds(payload.ads);
    setMessage(payload.message ?? fallbackMessage ?? null);
  }

  function handleConnect() {
    setIsConnecting(true);
    const returnTo = mode === "ads" ? "/dashboard/ads" : pathname || "/dashboard/integrations";
    window.location.assign(
      `/api/integrations/meta/auth?returnTo=${encodeURIComponent(returnTo)}`,
    );
  }

  async function handleSelectAccount(adAccountId: string) {
    setIsSelecting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/meta", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adAccountId,
        }),
      });
      const payload = (await response.json()) as MetaIntegrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update ad account.");
      }

      applyPayload(payload, "Meta ad account updated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update ad account.",
      );
    } finally {
      setIsSelecting(false);
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/meta/sync", {
        method: "POST",
      });
      const payload = (await response.json()) as MetaIntegrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to sync Meta campaigns.");
      }

      applyPayload(payload, "Meta campaigns synced.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to sync Meta campaigns.",
      );
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleDisconnect() {
    setIsDisconnecting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/integrations/meta", {
        method: "DELETE",
      });
      const payload = (await response.json()) as MetaIntegrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to disconnect Meta.");
      }

      applyPayload(payload, "Meta disconnected.");
      setCampaignForm((current) => ({
        ...current,
        name: "",
        adSetName: "",
        adName: "",
        creativeSourceKey: "",
      }));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to disconnect Meta.",
      );
    } finally {
      setIsDisconnecting(false);
      setIsConnecting(false);
    }
  }

  async function handleCreateCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingCampaign(true);
    setMessage(null);

    try {
      const response = await fetch("/api/meta/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...campaignForm,
          sourceSubmissionId: campaignForm.sourceSubmissionId || null,
          destinationUrl: campaignForm.destinationUrl || null,
          trackingUrl: trackingUrlPreview || null,
          dailyBudget: campaignForm.dailyBudget || null,
          countries: campaignForm.countries,
          pageId: campaignForm.pageId || null,
          adSetName: campaignForm.adSetName || null,
          adName: campaignForm.adName || null,
          creativeSourceKey: campaignForm.creativeSourceKey || null,
          primaryText: campaignForm.primaryText || null,
          headline: campaignForm.headline || null,
          description: campaignForm.description || null,
          callToActionType: campaignForm.callToActionType || null,
        }),
      });
      const payload = (await response.json()) as MetaIntegrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create Meta campaign.");
      }

      applyPayload(payload, "Meta campaign created.");
      setCampaignForm((current) => ({
        ...current,
        name: "",
        sourceSubmissionId: "",
        utmCampaign: "",
        utmContent: "",
        adSetName: "",
        adName: "",
        creativeSourceKey: "",
        primaryText: "",
        headline: "",
        description: "",
      }));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create Meta campaign.",
      );
    } finally {
      setIsSubmittingCampaign(false);
    }
  }

  async function handleMetaStatusUpdate({
    endpoint,
    pendingKey,
    status,
    successMessage,
    errorMessage,
  }: {
    endpoint: string;
    pendingKey: string;
    status: "ACTIVE" | "PAUSED";
    successMessage: string;
    errorMessage: string;
  }) {
    setPendingResourceKey(pendingKey);
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as MetaIntegrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? errorMessage);
      }

      applyPayload(payload, successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errorMessage);
    } finally {
      setPendingResourceKey(null);
    }
  }

  async function handleCampaignStatus(
    campaignId: string,
    status: "ACTIVE" | "PAUSED",
  ) {
    await handleMetaStatusUpdate({
      endpoint: `/api/meta/campaigns/${campaignId}`,
      pendingKey: `campaign:${campaignId}`,
      status,
      successMessage: `Campaign moved to ${status.toLowerCase()}.`,
      errorMessage: "Unable to update campaign status.",
    });
  }

  async function handleAdSetStatus(adSetId: string, status: "ACTIVE" | "PAUSED") {
    await handleMetaStatusUpdate({
      endpoint: `/api/meta/ad-sets/${adSetId}`,
      pendingKey: `ad-set:${adSetId}`,
      status,
      successMessage: `Ad set moved to ${status.toLowerCase()}.`,
      errorMessage: "Unable to update ad set status.",
    });
  }

  async function handleAdStatus(adId: string, status: "ACTIVE" | "PAUSED") {
    await handleMetaStatusUpdate({
      endpoint: `/api/meta/ads/${adId}`,
      pendingKey: `ad:${adId}`,
      status,
      successMessage: `Ad moved to ${status.toLowerCase()}.`,
      errorMessage: "Unable to update ad status.",
    });
  }

  const connectionSection = (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
            Meta Ads Connection
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-500">
            Connect a Meta user with ads permissions, choose a default ad
            account, sync campaign performance, and manage campaign status from
            CIRCL.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <MotionScale
            type="button"
            onClick={handleConnect}
            disabled={isConnecting}
            className="rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connection ? "Reconnect Meta" : "Connect Meta Account"}
          </MotionScale>
          {connection ? (
            <>
              <MotionScale
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSyncing ? "Syncing..." : "Sync campaigns"}
              </MotionScale>
              <MotionScale
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </MotionScale>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
          {connection ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    getMetaStatusClasses(connection.status),
                  )}
                >
                  {connection.status}
                </span>
                {connection.token_expires_at ? (
                  <span className="text-sm text-slate-500">
                    Token expires {formatDate(connection.token_expires_at)}
                  </span>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Meta user</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {connection.meta_user_name ?? connection.meta_user_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Business</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {connection.business_name ?? "Not linked"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Selected ad account</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {connection.ad_account_name ?? "Choose an account"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Last synced</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {connection.last_synced_at
                      ? formatDate(connection.last_synced_at)
                      : "Not synced yet"}
                  </p>
                </div>
              </div>
              {connection.last_error ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {connection.last_error}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-lg font-semibold text-slate-950">
                No Meta account connected yet
              </p>
              <p className="text-sm leading-7 text-slate-500">
                Connect Meta to pull campaign metrics, choose an ad account, and
                create campaigns from the CIRCL brand workspace.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-950">Ad accounts</p>
              <p className="mt-2 text-sm text-slate-500">
                Choose which Meta ad account CIRCL should use by default.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {adAccounts.length} accounts
            </span>
          </div>
          <div className="mt-6 space-y-3">
            {adAccounts.length ? (
              adAccounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  disabled={isSelecting}
                  onClick={() => void handleSelectAccount(account.meta_account_id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[1.35rem] border px-4 py-4 text-left transition",
                    account.is_selected
                      ? "border-accent/20 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {account.account_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {account.meta_account_id} • {account.currency ?? "Currency n/a"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      account.is_selected
                        ? "bg-white text-accent"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {account.is_selected ? "Selected" : "Use account"}
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-[1.35rem] border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                {connection
                  ? "No ad accounts were returned. Reconnect with a Meta user that has ads access."
                  : "Connect Meta first to load ad accounts."}
              </div>
            )}
          </div>
        </div>
      </div>

      {message ? <p className="mt-5 text-sm text-slate-500">{message}</p> : null}
    </section>
  );

  if (mode === "integrations") {
    return (
      <div className="space-y-6">
        {connectionSection}
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                Recent Meta Campaigns
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Preview the latest campaigns synced from your connected Meta ad accounts.
              </p>
            </div>
            <a
              href="/dashboard/ads"
              className="text-sm font-medium text-accent transition hover:text-blue-500"
            >
              Open Ads
            </a>
          </div>

          {isLoading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-[1.5rem] border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
          ) : recentCampaigns.length ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recentCampaigns.slice(0, 3).map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{campaign.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatMetaStatus(campaign.objective)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {adAccountNameById.get(campaign.ad_account_id) ?? campaign.ad_account_id}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        getMetaStatusClasses(
                          campaign.effective_status ?? campaign.status,
                        ),
                      )}
                    >
                      {formatMetaStatus(campaign.effective_status ?? campaign.status)}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Spend
                      </p>
                      <p className="mt-2 font-semibold text-slate-950">
                        {formatCompactCurrency(campaign.spend)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        CTR
                      </p>
                      <p className="mt-2 font-semibold text-slate-950">
                        {formatPercent(campaign.ctr)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
              {connection
                ? "No Meta campaigns have been synced yet. Sync your selected account or create a campaign from the Ads section."
                : "Connect Meta first to start pulling campaign performance into CIRCL."}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
              Submission Reporting
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
              Filter synced Meta reporting by approved creator content to see which
              submissions are driving spend, clicks, and active delivery.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 lg:max-w-md">
            <label
              htmlFor="meta-submission-filter"
              className="text-sm font-medium text-slate-600"
            >
              Reporting scope
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                id="meta-submission-filter"
                value={submissionFilter}
                onChange={(event) => setSubmissionFilter(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              >
                <option value={submissionFilterAllValue}>
                  All creator-linked reporting
                </option>
                <option value={submissionFilterUnlinkedValue}>
                  Unlinked campaigns and ads
                </option>
                {submissionFilterOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {submissionFilter !== submissionFilterAllValue ? (
                <MotionScale
                  type="button"
                  onClick={() => setSubmissionFilter(submissionFilterAllValue)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Clear
                </MotionScale>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Current scope
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {reportingScopeLabel}
          </p>
          <p className="mt-2 text-sm text-slate-500">{reportingScopeHint}</p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Connected accounts",
            value: String(adAccounts.length),
            hint: selectedAdAccount
              ? `Default: ${selectedAdAccount.account_name}`
              : "Select a Meta ad account",
          },
          {
            label: "Synced campaigns",
            value: formatCompactNumber(filteredCampaigns.length),
            hint: `${reportingScopeLabel} • ${
              connection?.last_synced_at
                ? `last sync ${formatDate(connection.last_synced_at)}`
                : "no sync completed yet"
            }`,
          },
          {
            label: "Launched ads",
            value: formatCompactNumber(filteredAds.length),
            hint: `${filteredAdSets.length} ad sets • ${formatCompactCurrency(totalAdSpend)} spend`,
          },
          {
            label: "Spend synced",
            value: formatCompactCurrency(scopeSpend),
            hint:
              submissionFilter === submissionFilterAllValue
                ? `${formatPercent(campaignCtr)} campaign CTR • ${formatPercent(adCtr)} ad CTR`
                : `${formatPercent(scopeCtr)} ${scopeLabel} CTR • ${formatCompactNumber(executionClicks)} clicks`,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
          >
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {metric.value}
            </p>
            <p className="mt-2 text-sm text-slate-500">{metric.hint}</p>
          </div>
        ))}
      </div>

      {connectionSection}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div>
            <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
              Launch Meta Campaign
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Create a Meta campaign directly from CIRCL, link it to approved creator
              content, and store the tracked landing URL you will use in ads.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleCreateCampaign}>
            <div>
              <label
                htmlFor="meta-campaign-name"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Campaign name
              </label>
              <input
                id="meta-campaign-name"
                required
                value={campaignForm.name}
                onChange={(event) =>
                  setCampaignForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="CIRCL Creator Traffic Test"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="meta-campaign-objective"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Objective
                </label>
                <select
                  id="meta-campaign-objective"
                  value={campaignForm.objective}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      objective: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                >
                  {objectiveOptions.map((objective) => (
                    <option key={objective.value} value={objective.value}>
                      {objective.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="meta-campaign-status"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Start status
                </label>
                <select
                  id="meta-campaign-status"
                  value={campaignForm.status}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                >
                  <option value="PAUSED">Paused</option>
                  <option value="ACTIVE">Active</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="meta-source-submission"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Approved creator submission
                </label>
                <select
                  id="meta-source-submission"
                  value={campaignForm.sourceSubmissionId}
                  onChange={(event) => {
                    const nextSubmissionId = event.target.value;
                    const nextSubmission =
                      approvedSubmissionById.get(nextSubmissionId) ?? null;
                    const nextCreativeSource =
                      nextSubmission?.assets.find(
                        (asset) => asset.kind === "image" || asset.kind === "video",
                      )?.id ?? null;

                    setCampaignForm((current) => ({
                      ...current,
                      sourceSubmissionId: nextSubmissionId,
                      creativeSourceKey: nextCreativeSource
                        ? `asset:${nextCreativeSource}`
                        : nextSubmission?.content_links[0]
                          ? "link:0"
                          : current.creativeSourceKey,
                      name:
                        current.name ||
                        (nextSubmission
                          ? `${nextSubmission.creator_name} ${nextSubmission.campaign_title}`
                          : current.name),
                      adSetName:
                        current.adSetName ||
                        (nextSubmission
                          ? `${nextSubmission.creator_name} ${nextSubmission.campaign_title} Ad Set`
                          : current.adSetName),
                      adName:
                        current.adName ||
                        (nextSubmission
                          ? `${nextSubmission.creator_name} ${nextSubmission.campaign_title} Ad`
                          : current.adName),
                      utmCampaign:
                        current.utmCampaign ||
                        `${analyticsSettings?.utm_campaign_prefix ?? "creator"}-${
                          slugifyTrackingValue(
                            nextSubmission?.campaign_title ?? nextSubmission?.creator_name,
                          ) || "launch"
                        }`,
                      utmContent:
                        current.utmContent ||
                        slugifyTrackingValue(nextSubmission?.creator_name) ||
                        "",
                      headline:
                        current.headline ||
                        nextSubmission?.campaign_title ||
                        current.headline,
                      primaryText:
                        current.primaryText ||
                        nextSubmission?.notes ||
                        `Creator-led ad for ${nextSubmission?.campaign_title ?? "this campaign"}`,
                    }));
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                >
                  <option value="">Select approved content</option>
                  {approvedSubmissions.map((submission) => (
                    <option key={submission.id} value={submission.id}>
                      {submission.creator_name} • {submission.campaign_title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="meta-destination-url"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Destination URL
                </label>
                <input
                  id="meta-destination-url"
                  value={campaignForm.destinationUrl}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      destinationUrl: event.target.value,
                    }))
                  }
                  placeholder="https://brand-store.com/products/..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  UTM source
                </label>
                <input
                  value={campaignForm.utmSource}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      utmSource: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  UTM medium
                </label>
                <input
                  value={campaignForm.utmMedium}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      utmMedium: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  UTM campaign
                </label>
                <input
                  value={campaignForm.utmCampaign}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      utmCampaign: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  UTM content
                </label>
                <input
                  value={campaignForm.utmContent}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      utmContent: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  UTM term
                </label>
                <input
                  value={campaignForm.utmTerm}
                  onChange={(event) =>
                    setCampaignForm((current) => ({
                      ...current,
                      utmTerm: event.target.value,
                    }))
                  }
                  placeholder="Optional"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-slate-950">
                  Ad Execution
                </p>
                <p className="text-sm text-slate-500">
                  Add these fields to launch the first Traffic ad set and ad from the selected creator content. Leave them blank if you only want to create the campaign shell.
                </p>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    Meta Page ID
                  </label>
                  <input
                    value={campaignForm.pageId}
                    onChange={(event) =>
                      setCampaignForm((current) => ({
                        ...current,
                        pageId: event.target.value,
                      }))
                    }
                    placeholder="123456789012345"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    Daily budget
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={campaignForm.dailyBudget}
                    onChange={(event) =>
                      setCampaignForm((current) => ({
                        ...current,
                        dailyBudget: event.target.value,
                      }))
                    }
                    placeholder="25"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    Countries
                  </label>
                  <input
                    value={campaignForm.countries}
                    onChange={(event) =>
                      setCampaignForm((current) => ({
                        ...current,
                        countries: event.target.value,
                      }))
                    }
                    placeholder="US, CA"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    Ad set name
                  </label>
                  <input
                    value={campaignForm.adSetName}
                    onChange={(event) =>
                      setCampaignForm((current) => ({
                        ...current,
                        adSetName: event.target.value,
                      }))
                    }
                    placeholder="Creator Traffic Ad Set"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    Ad name
                  </label>
                  <input
                    value={campaignForm.adName}
                    onChange={(event) =>
                      setCampaignForm((current) => ({
                        ...current,
                        adName: event.target.value,
                      }))
                    }
                    placeholder="Creator Traffic Ad"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    Creative source
                  </label>
                  <select
                    value={campaignForm.creativeSourceKey}
                    onChange={(event) =>
                      setCampaignForm((current) => ({
                        ...current,
                        creativeSourceKey: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  >
                    <option value="">Select asset or content link</option>
                    {creativeSourceOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {creativeSourceOptions.length ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {creativeSourceOptions.find(
                        (option) => option.key === campaignForm.creativeSourceKey,
                      )?.hint ?? "Choose an image, video, or direct content link."}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Select an approved submission first to load assets and content links.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    Primary text
                  </label>
                  <textarea
                    value={campaignForm.primaryText}
                    onChange={(event) =>
                      setCampaignForm((current) => ({
                        ...current,
                        primaryText: event.target.value,
                      }))
                    }
                    rows={4}
                    placeholder="Write the main ad copy."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                </div>
                <div className="grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                      Headline
                    </label>
                    <input
                      value={campaignForm.headline}
                      onChange={(event) =>
                        setCampaignForm((current) => ({
                          ...current,
                          headline: event.target.value,
                        }))
                      }
                      placeholder="Scroll-stopping headline"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                      Description
                    </label>
                    <input
                      value={campaignForm.description}
                      onChange={(event) =>
                        setCampaignForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Optional supporting line"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                      Call to action
                    </label>
                    <select
                      value={campaignForm.callToActionType}
                      onChange={(event) =>
                        setCampaignForm((current) => ({
                          ...current,
                          callToActionType: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                    >
                      {callToActionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              {selectedAdAccount ? (
                <div className="space-y-2">
                  <p>
                    New campaigns will be created in{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedAdAccount.account_name}
                    </span>
                    .
                  </p>
                  <p className="break-all text-xs text-slate-600">
                    Tracking URL:{" "}
                    <span className="font-medium text-slate-900">
                      {trackingUrlPreview || "Add a destination URL to generate it."}
                    </span>
                  </p>
                  {selectedSubmission ? (
                    <p className="text-xs text-slate-600">
                      Linked submission:{" "}
                    <span className="font-medium text-slate-900">
                      {selectedSubmission.creator_name} • {selectedSubmission.campaign_title}
                    </span>
                  </p>
                ) : null}
                  {executionIntent ? (
                    <>
                      <p className="text-xs text-slate-600">
                        Execution:{" "}
                        <span className="font-medium text-slate-900">
                          Campaign + Traffic ad set + first ad
                        </span>
                      </p>
                      <p className="text-xs text-slate-600">
                        Creative source:{" "}
                        <span className="font-medium text-slate-900">
                          {selectedCreativeSourceOption?.label ?? "Not selected"}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-600">
                      Leave the execution fields blank if you only want to create the campaign shell.
                    </p>
                  )}
                </div>
              ) : (
                <p>
                  Select a Meta ad account above before creating a campaign.
                </p>
              )}
            </div>

            <MotionScale
              type="submit"
              disabled={!selectedAdAccount || isSubmittingCampaign}
              className="rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingCampaign
                ? "Creating..."
                : executionIntent
                  ? "Create Campaign + Ad"
                  : "Create Meta Campaign"}
            </MotionScale>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                Synced Meta Campaigns
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Monitor campaign delivery, spend, CTR, and update campaign status across your connected Meta ad accounts.
              </p>
            </div>
            <MotionScale
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSyncing ? "Syncing..." : "Refresh Meta"}
            </MotionScale>
          </div>

          {isLoading ? (
            <div className="mt-8 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-[1.5rem] border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
          ) : filteredCampaigns.length ? (
            <div className="mt-8 space-y-4">
              {filteredCampaigns.map((campaign) => {
                const statusValue = campaign.effective_status ?? campaign.status;
                const nextStatus =
                  statusValue?.toLowerCase() === "active" ? "PAUSED" : "ACTIVE";
                const linkedSubmission =
                  campaign.source_submission_id
                    ? approvedSubmissionById.get(campaign.source_submission_id) ?? null
                    : null;
                const linkedAdSets = (adSetsByCampaignId.get(campaign.id) ?? []).filter(
                  (adSet) =>
                    matchesSubmissionFilter(adSet.source_submission_id, submissionFilter),
                );
                const linkedAds = (adsByCampaignId.get(campaign.id) ?? []).filter((ad) =>
                  matchesSubmissionFilter(ad.source_submission_id, submissionFilter),
                );
                const latestAd = linkedAds[0] ?? null;
                const campaignPendingKey = `campaign:${campaign.meta_campaign_id}`;

                return (
                  <div
                    key={campaign.id}
                    className="rounded-[1.5rem] border border-slate-200 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-semibold text-slate-950">
                            {campaign.name}
                          </h3>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              getMetaStatusClasses(statusValue),
                            )}
                          >
                            {formatMetaStatus(statusValue)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {formatMetaStatus(campaign.objective)} • Synced{" "}
                          {formatDate(campaign.synced_at)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {adAccountNameById.get(campaign.ad_account_id) ?? campaign.ad_account_id}
                        </p>
                        {linkedSubmission ? (
                          <p className="mt-1 text-sm text-slate-500">
                            Creator content: {linkedSubmission.creator_name} •{" "}
                            {linkedSubmission.campaign_title}
                          </p>
                        ) : campaign.source_submission_id ? (
                          <p className="mt-1 text-sm text-slate-500">
                            Linked to approved creator content
                          </p>
                        ) : null}
                        {linkedAds.length ? (
                          <p className="mt-1 text-sm text-slate-500">
                            {linkedAds.length} launched ad{linkedAds.length === 1 ? "" : "s"} across{" "}
                            {linkedAdSets.length} ad set{linkedAdSets.length === 1 ? "" : "s"}
                          </p>
                        ) : null}
                      </div>
                      <MotionScale
                        type="button"
                        onClick={() =>
                          void handleCampaignStatus(
                            campaign.meta_campaign_id,
                            nextStatus,
                          )
                        }
                        disabled={pendingResourceKey === campaignPendingKey}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingResourceKey === campaignPendingKey
                          ? "Updating..."
                          : nextStatus === "ACTIVE"
                            ? "Activate"
                            : "Pause"}
                      </MotionScale>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Spend</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {formatCurrency(campaign.spend)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Impressions</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {formatCompactNumber(campaign.impressions)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Clicks</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {formatCompactNumber(campaign.clicks)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">CTR</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {formatPercent(campaign.ctr)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          Daily budget
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-950">
                          {campaign.daily_budget !== null
                            ? formatCurrency(campaign.daily_budget / 100)
                            : "Not set"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          Lifetime budget
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-950">
                          {campaign.lifetime_budget !== null
                            ? formatCurrency(campaign.lifetime_budget / 100)
                            : "Not set"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 sm:col-span-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                          Tracking URL
                        </p>
                        <p className="mt-2 break-all text-base font-semibold text-slate-950">
                          {campaign.tracking_url ?? campaign.destination_url ?? "Not configured"}
                        </p>
                      </div>
                      {latestAd ? (
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 sm:col-span-2">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                            Latest launched ad
                          </p>
                          <p className="mt-2 text-base font-semibold text-slate-950">
                            {latestAd.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatMetaStatus(latestAd.status ?? latestAd.effective_status)} •{" "}
                            {latestAd.source_asset_kind ?? "asset unknown"} • CTA{" "}
                            {latestAd.call_to_action_type ?? "n/a"}
                          </p>
                          {latestAd.primary_text ? (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {latestAd.primary_text}
                            </p>
                          ) : null}
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-white p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                Spend
                              </p>
                              <p className="mt-2 font-semibold text-slate-950">
                                {formatCurrency(latestAd.spend)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                Clicks
                              </p>
                              <p className="mt-2 font-semibold text-slate-950">
                                {formatCompactNumber(latestAd.clicks)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                CTR
                              </p>
                              <p className="mt-2 font-semibold text-slate-950">
                                {formatPercent(latestAd.ctr)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {linkedAdSets.length || linkedAds.length ? (
                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold text-slate-950">
                                Ad Sets
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Activate or pause individual delivery groups.
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              {linkedAdSets.length}
                            </span>
                          </div>

                          {linkedAdSets.length ? (
                            <div className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                              {linkedAdSets.map((adSet) => {
                                const adSetStatusValue =
                                  adSet.effective_status ?? adSet.status;
                                const nextAdSetStatus =
                                  adSetStatusValue?.toLowerCase() === "active"
                                    ? "PAUSED"
                                    : "ACTIVE";
                                const adSetPendingKey = `ad-set:${adSet.meta_ad_set_id}`;

                                return (
                                  <div
                                    key={adSet.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4"
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="font-semibold text-slate-950">
                                            {adSet.name}
                                          </p>
                                          <span
                                            className={cn(
                                              "rounded-full px-3 py-1 text-[11px] font-semibold",
                                              getMetaStatusClasses(adSetStatusValue),
                                            )}
                                          >
                                            {formatMetaStatus(adSetStatusValue)}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-500">
                                          {adSet.targeting_countries.length
                                            ? adSet.targeting_countries.join(", ")
                                            : "No geo targeting"}{" "}
                                          • {adSet.optimization_goal ?? "Optimization n/a"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                          Daily budget{" "}
                                          <span className="font-medium text-slate-700">
                                            {adSet.daily_budget !== null
                                              ? formatCurrency(adSet.daily_budget / 100)
                                              : "Not set"}
                                          </span>
                                        </p>
                                      </div>
                                      <MotionScale
                                        type="button"
                                        onClick={() =>
                                          void handleAdSetStatus(
                                            adSet.meta_ad_set_id,
                                            nextAdSetStatus,
                                          )
                                        }
                                        disabled={pendingResourceKey === adSetPendingKey}
                                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {pendingResourceKey === adSetPendingKey
                                          ? "Updating..."
                                          : nextAdSetStatus === "ACTIVE"
                                            ? "Activate"
                                            : "Pause"}
                                      </MotionScale>
                                    </div>

                                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                      <div className="rounded-2xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                          Spend
                                        </p>
                                        <p className="mt-2 font-semibold text-slate-950">
                                          {formatCurrency(adSet.spend)}
                                        </p>
                                      </div>
                                      <div className="rounded-2xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                          Clicks
                                        </p>
                                        <p className="mt-2 font-semibold text-slate-950">
                                          {formatCompactNumber(adSet.clicks)}
                                        </p>
                                      </div>
                                      <div className="rounded-2xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                          CTR
                                        </p>
                                        <p className="mt-2 font-semibold text-slate-950">
                                          {formatPercent(adSet.ctr)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                              No ad sets match the current reporting filter.
                            </div>
                          )}
                        </div>

                        <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-base font-semibold text-slate-950">
                                Ads
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Control live ads and inspect creator-level performance.
                              </p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              {linkedAds.length}
                            </span>
                          </div>

                          {linkedAds.length ? (
                            <div className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                              {linkedAds.map((ad) => {
                                const adStatusValue = ad.effective_status ?? ad.status;
                                const nextAdStatus =
                                  adStatusValue?.toLowerCase() === "active"
                                    ? "PAUSED"
                                    : "ACTIVE";
                                const adPendingKey = `ad:${ad.meta_ad_id}`;
                                const adSubmission =
                                  ad.source_submission_id
                                    ? approvedSubmissionById.get(ad.source_submission_id) ?? null
                                    : null;

                                return (
                                  <div
                                    key={ad.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4"
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="font-semibold text-slate-950">
                                            {ad.name}
                                          </p>
                                          <span
                                            className={cn(
                                              "rounded-full px-3 py-1 text-[11px] font-semibold",
                                              getMetaStatusClasses(adStatusValue),
                                            )}
                                          >
                                            {formatMetaStatus(adStatusValue)}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-500">
                                          {ad.source_asset_kind ?? "asset unknown"} • CTA{" "}
                                          {ad.call_to_action_type ?? "n/a"}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                          {adSubmission
                                            ? `${adSubmission.creator_name} • ${adSubmission.campaign_title}`
                                            : "No linked approved submission"}
                                        </p>
                                      </div>
                                      <MotionScale
                                        type="button"
                                        onClick={() =>
                                          void handleAdStatus(ad.meta_ad_id, nextAdStatus)
                                        }
                                        disabled={pendingResourceKey === adPendingKey}
                                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {pendingResourceKey === adPendingKey
                                          ? "Updating..."
                                          : nextAdStatus === "ACTIVE"
                                            ? "Activate"
                                            : "Pause"}
                                      </MotionScale>
                                    </div>

                                    {ad.primary_text ? (
                                      <p className="mt-3 text-sm leading-6 text-slate-600">
                                        {ad.primary_text}
                                      </p>
                                    ) : null}

                                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                      <div className="rounded-2xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                          Spend
                                        </p>
                                        <p className="mt-2 font-semibold text-slate-950">
                                          {formatCurrency(ad.spend)}
                                        </p>
                                      </div>
                                      <div className="rounded-2xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                          Clicks
                                        </p>
                                        <p className="mt-2 font-semibold text-slate-950">
                                          {formatCompactNumber(ad.clicks)}
                                        </p>
                                      </div>
                                      <div className="rounded-2xl bg-slate-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                          CTR
                                        </p>
                                        <p className="mt-2 font-semibold text-slate-950">
                                          {formatPercent(ad.ctr)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
                                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                        Tracking URL
                                      </p>
                                      <p className="mt-2 break-all font-medium text-slate-900">
                                        {ad.tracking_url ?? ad.destination_url ?? "Not configured"}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                              No ads match the current reporting filter.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
              {connection
                ? submissionFilter === submissionFilterAllValue
                  ? "No Meta campaigns have been synced yet. Create one above or sync your selected account."
                  : `No Meta campaigns match ${reportingScopeLabel.toLowerCase()}.`
                : "Connect Meta first to start running and tracking campaigns from CIRCL."}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
