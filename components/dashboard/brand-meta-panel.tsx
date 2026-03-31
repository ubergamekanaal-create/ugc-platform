"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MotionScale } from "@/components/shared/motion";
import type {
  BrandMetaAdAccountSummary,
  BrandMetaCampaignSummary,
  BrandMetaConnectionSummary,
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
};

type MetaIntegrationResponse = {
  connection: BrandMetaConnectionSummary | null;
  adAccounts: BrandMetaAdAccountSummary[];
  campaigns: BrandMetaCampaignSummary[];
  message?: string;
  error?: string;
};

const objectiveOptions = [
  { value: "OUTCOME_AWARENESS", label: "Awareness" },
  { value: "OUTCOME_TRAFFIC", label: "Traffic" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement" },
  { value: "OUTCOME_LEADS", label: "Leads" },
  { value: "OUTCOME_APP_PROMOTION", label: "App Promotion" },
  { value: "OUTCOME_SALES", label: "Sales" },
];

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

export function BrandMetaPanel({ mode }: BrandMetaPanelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [connection, setConnection] =
    useState<BrandMetaConnectionSummary | null>(null);
  const [adAccounts, setAdAccounts] = useState<BrandMetaAdAccountSummary[]>([]);
  const [campaigns, setCampaigns] = useState<BrandMetaCampaignSummary[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null);
  const hasAutoSyncedRef = useRef(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    objective: objectiveOptions[1]?.value ?? "OUTCOME_TRAFFIC",
    status: "PAUSED",
  });

  useEffect(() => {
    void (async () => {
      setIsLoading(true);

      try {
        const response = await fetch("/api/integrations/meta", {
          cache: "no-store",
        });
        const payload = (await response.json()) as MetaIntegrationResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load Meta integration.");
        }

        setConnection(payload.connection);
        setAdAccounts(payload.adAccounts);
        setCampaigns(payload.campaigns);

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

  const totalSpend = campaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
  const totalClicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
  const totalImpressions = campaigns.reduce(
    (sum, campaign) => sum + campaign.impressions,
    0,
  );
  const activeCampaigns = campaigns.filter((campaign) => {
    const effective = campaign.effective_status?.toLowerCase();
    const status = campaign.status?.toLowerCase();
    return effective === "active" || status === "active";
  }).length;
  const overallCtr = totalImpressions
    ? (totalClicks / totalImpressions) * 100
    : campaigns.length
      ? campaigns.reduce((sum, campaign) => sum + campaign.ctr, 0) / campaigns.length
      : 0;
  const recentCampaigns = useMemo(() => campaigns.slice(0, 6), [campaigns]);
  const adAccountNameById = useMemo(
    () =>
      new Map(
        adAccounts.map((account) => [account.meta_account_id, account.account_name] as const),
      ),
    [adAccounts],
  );

  function applyPayload(payload: MetaIntegrationResponse, fallbackMessage?: string) {
    setConnection(payload.connection);
    setAdAccounts(payload.adAccounts);
    setCampaigns(payload.campaigns);
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
      setCampaignForm((current) => ({ ...current, name: "" }));
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
        body: JSON.stringify(campaignForm),
      });
      const payload = (await response.json()) as MetaIntegrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create Meta campaign.");
      }

      applyPayload(payload, "Meta campaign created.");
      setCampaignForm((current) => ({
        ...current,
        name: "",
      }));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create Meta campaign.",
      );
    } finally {
      setIsSubmittingCampaign(false);
    }
  }

  async function handleCampaignStatus(
    campaignId: string,
    status: "ACTIVE" | "PAUSED",
  ) {
    setPendingCampaignId(campaignId);
    setMessage(null);

    try {
      const response = await fetch(`/api/meta/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as MetaIntegrationResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update campaign status.");
      }

      applyPayload(payload, `Campaign moved to ${status.toLowerCase()}.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update campaign status.",
      );
    } finally {
      setPendingCampaignId(null);
    }
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
            value: formatCompactNumber(campaigns.length),
            hint: connection?.last_synced_at
              ? `Last sync ${formatDate(connection.last_synced_at)}`
              : "No sync completed yet",
          },
          {
            label: "Active campaigns",
            value: formatCompactNumber(activeCampaigns),
            hint: `${campaigns.length - activeCampaigns} paused or archived`,
          },
          {
            label: "Spend synced",
            value: formatCompactCurrency(totalSpend),
            hint: `${formatPercent(overallCtr)} blended CTR`,
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
              Create a Meta campaign directly from CIRCL, then sync it back into
              your brand analytics. Campaign creation is supported here; deeper
              ad set and creative configuration can be layered on next.
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

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              {selectedAdAccount ? (
                <p>
                  New campaigns will be created in{" "}
                  <span className="font-semibold text-slate-900">
                    {selectedAdAccount.account_name}
                  </span>
                  .
                </p>
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
              {isSubmittingCampaign ? "Creating..." : "Create Meta Campaign"}
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
          ) : campaigns.length ? (
            <div className="mt-8 space-y-4">
              {campaigns.map((campaign) => {
                const statusValue = campaign.effective_status ?? campaign.status;
                const nextStatus =
                  statusValue?.toLowerCase() === "active" ? "PAUSED" : "ACTIVE";

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
                      </div>
                      <MotionScale
                        type="button"
                        onClick={() =>
                          void handleCampaignStatus(
                            campaign.meta_campaign_id,
                            nextStatus,
                          )
                        }
                        disabled={pendingCampaignId === campaign.meta_campaign_id}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingCampaignId === campaign.meta_campaign_id
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
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
              {connection
                ? "No Meta campaigns have been synced yet. Create one above or sync your selected account."
                : "Connect Meta first to start running and tracking campaigns from CIRCL."}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
