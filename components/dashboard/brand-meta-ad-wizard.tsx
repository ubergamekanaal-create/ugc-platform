"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
    type FormEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useState,
} from "react";
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
    SubmissionAsset,
} from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type Props = {
    approvedSubmissions: BrandSubmissionSummary[];
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

const steps = [
    {
        title: "Select submissions",
        subtitle: "Choose approved content",
    },
    {
        title: "Configure ads",
        subtitle: "Campaign setup",
    },
    {
        title: "Review & launch",
        subtitle: "Final review",
    },
];

type CampaignFormState = {
    name: string;
    objective: string;
    status: string;
    sourceSubmissionId: string;
    destinationUrl: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent: string;
    utmTerm: string;
    pageId: string;
    adSetName: string;
    adName: string;
    dailyBudget: string;
    countries: string;
    creativeSourceKey: string;
    primaryText: string;
    headline: string;
    description: string;
    callToActionType: string;
};

const defaultCampaignForm: CampaignFormState = {
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
};

function getProductLabel(submission: BrandSubmissionSummary) {
    return (
        submission.product_name?.trim() ||
        submission.campaign_title ||
        "Untitled product"
    );
}

function getPreviewAsset(assets: SubmissionAsset[]) {
    return (
        assets.find((asset) => asset.kind === "image" && asset.signed_url) ||
        assets.find((asset) => asset.kind === "video" && asset.signed_url) ||
        assets.find((asset) => asset.signed_url) ||
        null
    );
}

function getSubmissionDateLabel(submission: BrandSubmissionSummary) {
    const dateValue =
        submission.reviewed_at ||
        submission.submitted_at ||
        submission.updated_at ||
        submission.created_at;

    return formatDate(dateValue);
}

function formatStatusLabel(value: string) {
    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

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

function hasValue(value: string) {
    return value.trim().length > 0;
}

function SearchIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-4 w-4"
            fill="none"
        >
            <path
                d="M14.583 14.583 18 18m-1.75-8.833a7.083 7.083 0 1 1-14.167 0 7.083 7.083 0 0 1 14.167 0Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

function ArrowRightIcon() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="h-4 w-4"
            fill="none"
        >
            <path
                d="M4.167 10h11.666m0 0-4.166-4.167M15.833 10l-4.166 4.167"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}

function SectionCard({
    title,
    hint,
    action,
    children,
}: {
    title: string;
    hint: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{hint}</p>
                </div>
                {action}
            </div>
            <div className="mt-4 space-y-4">{children}</div>
        </section>
    );
}

export function BrandMetaAdWizard({
    approvedSubmissions,
}: Props) {
    const [step, setStep] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [creatorFilter, setCreatorFilter] = useState("all");
    const [productFilter, setProductFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [campaignForm, setCampaignForm] =
        useState<CampaignFormState>(defaultCampaignForm);
    const [connection, setConnection] =
        useState<BrandMetaConnectionSummary | null>(null);
    const [adAccounts, setAdAccounts] = useState<BrandMetaAdAccountSummary[]>([]);
    const [campaigns, setCampaigns] = useState<BrandMetaCampaignSummary[]>([]);
    const [adSets, setAdSets] = useState<BrandMetaAdSetSummary[]>([]);
    const [ads, setAds] = useState<BrandMetaAdSummary[]>([]);
    const [analyticsSettings, setAnalyticsSettings] =
        useState<BrandStoreAnalyticsSettings | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
    const [isLoadingMeta, setIsLoadingMeta] = useState(false);
    const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
    const [selectedPreviewFailed, setSelectedPreviewFailed] = useState(false);

    const creatorOptions = useMemo(
        () => [
            "all",
            ...new Set(approvedSubmissions.map((item) => item.creator_name)),
        ],
        [approvedSubmissions],
    );

    const productOptions = useMemo(
        () => [
            "all",
            ...new Set(approvedSubmissions.map((item) => getProductLabel(item))),
        ],
        [approvedSubmissions],
    );

    const statusOptions = useMemo(
        () => [
            "all",
            ...new Set(approvedSubmissions.map((item) => item.status)),
        ],
        [approvedSubmissions],
    );

    const filteredSubmissions = approvedSubmissions.filter((submission) => {
        const normalizedSearch = search.trim().toLowerCase();
        const productLabel = getProductLabel(submission);
        const matchesSearch =
            !normalizedSearch ||
            submission.id.toLowerCase().includes(normalizedSearch) ||
            submission.creator_name.toLowerCase().includes(normalizedSearch) ||
            productLabel.toLowerCase().includes(normalizedSearch);

        const matchesCreator =
            creatorFilter === "all" ||
            submission.creator_name === creatorFilter;

        const matchesProduct =
            productFilter === "all" ||
            productLabel === productFilter;

        const matchesStatus =
            statusFilter === "all" ||
            submission.status === statusFilter;

        return (
            matchesSearch &&
            matchesCreator &&
            matchesProduct &&
            matchesStatus
        );
    });

    function toggleSubmission(id: string) {
        setSelectedIds((previous) => (previous.includes(id) ? [] : [id]));
    }

    const selectedSubmissions = approvedSubmissions.filter((item) =>
        selectedIds.includes(item.id),
    );
    const selectedSubmission = selectedSubmissions[0] ?? null;

    const selectedAdAccount =
        adAccounts.find((account) => account.is_selected) ??
        (connection?.ad_account_id
            ? adAccounts.find(
                (account) => account.meta_account_id === connection.ad_account_id,
            ) ?? null
            : null);

    const selectedPreviewAsset = useMemo(
        () => (selectedSubmission ? getPreviewAsset(selectedSubmission.assets) : null),
        [selectedSubmission],
    );

    const creativeSourceOptions = useMemo(() => {
        if (!selectedSubmission) {
            return [];
        }

        const assetOptions = selectedSubmission.assets
            .filter((asset) => asset.kind === "image" || asset.kind === "video")
            .map((asset) => ({
                key: `asset:${asset.id}`,
                label: `${asset.kind === "video" ? "Video" : "Image"} asset`,
                hint: asset.file_name,
            }));

        const linkOptions = selectedSubmission.content_links.map((link, index) => ({
            key: `link:${index}`,
            label: `Content link ${index + 1}`,
            hint: link,
        }));

        return [...assetOptions, ...linkOptions];
    }, [selectedSubmission]);

    const selectedCreativeSourceOption =
        creativeSourceOptions.find(
            (option) => option.key === campaignForm.creativeSourceKey,
        ) ?? null;

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

    const hasActiveFilters =
        search.trim().length > 0 ||
        creatorFilter !== "all" ||
        productFilter !== "all" ||
        statusFilter !== "all";

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

    const reviewValidationItems = [
        {
            label: "Meta connection",
            valid: Boolean(connection && selectedAdAccount),
        },
        {
            label: "Campaign name",
            valid: hasValue(campaignForm.name),
        },
        {
            label: "Traffic objective",
            valid: campaignForm.objective === "OUTCOME_TRAFFIC",
        },
        {
            label: "Ad set name",
            valid: hasValue(campaignForm.adSetName),
        },
        {
            label: "Daily budget",
            valid: hasValue(campaignForm.dailyBudget),
        },
        {
            label: "Target countries",
            valid: hasValue(campaignForm.countries),
        },
        {
            label: "Ad name",
            valid: hasValue(campaignForm.adName),
        },
        {
            label: "Meta Page ID",
            valid: hasValue(campaignForm.pageId),
        },
        {
            label: "Creative source",
            valid: hasValue(campaignForm.creativeSourceKey),
        },
        {
            label: "Primary text",
            valid: hasValue(campaignForm.primaryText),
        },
        {
            label: "Headline",
            valid: hasValue(campaignForm.headline),
        },
        {
            label: "Destination URL",
            valid: hasValue(campaignForm.destinationUrl),
        },
        {
            label: "UTM source",
            valid: hasValue(campaignForm.utmSource),
        },
        {
            label: "UTM medium",
            valid: hasValue(campaignForm.utmMedium),
        },
        {
            label: "UTM campaign",
            valid: hasValue(campaignForm.utmCampaign),
        },
        {
            label: "UTM content",
            valid: hasValue(campaignForm.utmContent),
        },
        {
            label: "CTA",
            valid: hasValue(campaignForm.callToActionType),
        },
    ];

    const missingReviewFields = reviewValidationItems
        .filter((item) => !item.valid)
        .map((item) => item.label);

    const canProceedToReview =
        Boolean(selectedSubmission) && missingReviewFields.length === 0;

    function applyPayload(
        payload: MetaIntegrationResponse,
        fallbackMessage?: string,
    ) {
        setConnection(payload.connection);
        setAdAccounts(payload.adAccounts);
        setCampaigns(payload.campaigns);
        setAdSets(payload.adSets);
        setAds(payload.ads);
        setMessage(payload.message ?? fallbackMessage ?? null);
        setMessageTone("success");
    }

    useEffect(() => {
        void (async () => {
            setIsLoadingMeta(true);

            try {
                const [metaResponse, analyticsResponse] = await Promise.all([
                    fetch("/api/integrations/meta", {
                        cache: "no-store",
                    }),
                    fetch("/api/integrations/store/analytics", {
                        cache: "no-store",
                    }),
                ]);

                const metaPayload =
                    (await metaResponse.json()) as MetaIntegrationResponse;

                if (!metaResponse.ok) {
                    throw new Error(
                        metaPayload.error ?? "Unable to load Meta integration.",
                    );
                }

                setConnection(metaPayload.connection);
                setAdAccounts(metaPayload.adAccounts);
                setCampaigns(metaPayload.campaigns);
                setAdSets(metaPayload.adSets);
                setAds(metaPayload.ads);

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
            } catch (error) {
                setMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to load Meta integration.",
                );
                setMessageTone("error");
            } finally {
                setIsLoadingMeta(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!selectedSubmission) {
            return;
        }

        const nextCreative =
            selectedSubmission.assets.find(
                (asset) => asset.kind === "image" || asset.kind === "video",
            ) ?? null;

        setCampaignForm((current) => ({
            ...current,
            sourceSubmissionId: selectedSubmission.id,
            name: `${selectedSubmission.creator_name} ${selectedSubmission.campaign_title}`,
            adSetName: `${selectedSubmission.creator_name} ${selectedSubmission.campaign_title} Ad Set`,
            adName: `${selectedSubmission.creator_name} ${selectedSubmission.campaign_title} Ad`,
            headline: selectedSubmission.campaign_title,
            primaryText:
                selectedSubmission.notes ||
                `Creator-led ad for ${selectedSubmission.campaign_title}`,
            creativeSourceKey: nextCreative
                ? `asset:${nextCreative.id}`
                : selectedSubmission.content_links[0]
                    ? "link:0"
                    : "",
            utmCampaign: `${analyticsSettings?.utm_campaign_prefix ?? "creator"}-${slugifyTrackingValue(
                selectedSubmission.campaign_title,
            ) || "launch"}`,
            utmContent:
                slugifyTrackingValue(selectedSubmission.creator_name) || "",
        }));
    }, [analyticsSettings?.utm_campaign_prefix, selectedSubmission]);

    useEffect(() => {
        setSelectedPreviewFailed(false);
    }, [selectedSubmission?.id]);

    async function submitCampaign() {
        if (!canProceedToReview) {
            setMessage("Complete all required fields before launching this ad.");
            setMessageTone("error");
            return;
        }

        setIsSubmittingCampaign(true);
        setMessage(null);
        setMessageTone("info");

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
                error instanceof Error
                    ? error.message
                    : "Unable to create Meta campaign.",
            );
            setMessageTone("error");
        } finally {
            setIsSubmittingCampaign(false);
        }
    }

    async function handleCreateCampaign(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await submitCampaign();
    }

    const messageClassName =
        messageTone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : messageTone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-slate-200 bg-slate-50 text-slate-600";

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-[2rem] font-semibold text-slate-950">
                    Create Meta Campaign
                </h1>
                <p className="mt-2 text-slate-500">
                    Build and launch campaigns in 3 steps
                </p>
            </div>

            {/* <div className="flex flex-col gap-4 border-b border-slate-200 pb-8 md:flex-row">
                {steps.map((item, index) => (
                    <div
                        key={item.title}
                        className="flex flex-1 items-start gap-4"
                    >
                        <div
                            className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition",
                                step >= index + 1
                                    ? "bg-accent text-white"
                                    : "bg-slate-100 text-slate-500",
                            )}
                        >
                            {index + 1}
                        </div>

                        <div>
                            <p className="font-semibold text-slate-900">{item.title}</p>
                            <p className="text-sm text-slate-500">{item.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div> */}

            {step === 1 && (
                <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:p-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fbff)] p-5 sm:p-6">
                            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                                            Step 1 of 3
                                        </p>
                                        <h2 className="mt-2 text-[1.2rem] font-semibold tracking-tight text-slate-950">
                                            Select submissions
                                        </h2>
                                        <p className="mt-2 text-sm text-slate-600">
                                            Choose one approved creator submission to build an ad
                                            from.
                                        </p>
                                    </div>

                                    {/* <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                                        {selectedSubmissions.length
                                            ? "1 submission selected"
                                            : "Select 1 submission"}
                                    </div> */}
                                </div>

                                <div className="flex flex-col gap-3">
                                    {/* <label className="flex h-12 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                                        <SearchIcon />
                                        <input
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            placeholder="Search submission ID, creator, or product"
                                            className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                        />
                                    </label> */}

                                    <div className="flex flex-wrap gap-3">
                                        <label className="flex h-12 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                                            <SearchIcon />
                                            <input
                                                value={search}
                                                onChange={(event) => setSearch(event.target.value)}
                                                placeholder="Search submission ID, creator, or product"
                                                className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                                            />
                                        </label>
                                        <select
                                            value={creatorFilter}
                                            onChange={(event) =>
                                                setCreatorFilter(event.target.value)
                                            }
                                            className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                                        >
                                            {creatorOptions.map((item) => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item === "all" ? "All creators" : item}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={productFilter}
                                            onChange={(event) =>
                                                setProductFilter(event.target.value)
                                            }
                                            className="h-11 rounded-full max-w-[200px] border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                                        >
                                            {productOptions.map((item) => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item === "all" ? "All products" : item}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={statusFilter}
                                            onChange={(event) =>
                                                setStatusFilter(event.target.value)
                                            }
                                            className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                                        >
                                            {statusOptions.map((item) => (
                                                <option
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item === "all"
                                                        ? "All status"
                                                        : formatStatusLabel(item)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch("");
                                                setSelectedIds([]);
                                                setCreatorFilter("all");
                                                setProductFilter("all");
                                                setStatusFilter("all");
                                            }}
                                            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                        >
                                            Clear
                                        </button>

                                        <p className="text-sm text-slate-500">
                                            {filteredSubmissions.length} available
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                {filteredSubmissions.length ? (
                                    filteredSubmissions.map((submission) => {
                                        const isSelected = selectedIds.includes(submission.id);
                                        const previewAsset = getPreviewAsset(submission.assets);
                                        const productLabel = getProductLabel(submission);

                                        return (
                                            <button
                                                key={submission.id}
                                                type="button"
                                                onClick={() => toggleSubmission(submission.id)}
                                                className={cn(
                                                    "flex w-full items-center gap-4 rounded-[24px] border p-4 text-left transition sm:p-5",
                                                    isSelected
                                                        ? "border-accent/30 bg-[rgba(7,107,210,0.08)] shadow-[0_14px_40px_rgba(7,107,210,0.12)]"
                                                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                                                )}
                                            >
                                                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white">
                                                    <div
                                                        className={cn(
                                                            "h-2.5 w-2.5 rounded-full transition",
                                                            isSelected ? "bg-accent" : "bg-transparent",
                                                        )}
                                                    />
                                                </div>

                                                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                                                    {previewAsset?.signed_url ? (
                                                        previewAsset.kind === "video" ? (
                                                            <video
                                                                muted
                                                                playsInline
                                                                className="h-full w-full object-cover"
                                                            >
                                                                <source
                                                                    src={previewAsset.signed_url}
                                                                    type={previewAsset.mime_type ?? undefined}
                                                                />
                                                            </video>
                                                        ) : (
                                                            <img
                                                                src={previewAsset.signed_url}
                                                                alt={submission.creator_name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        )
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-400">
                                                            {submission.creator_name
                                                                .slice(0, 1)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <p className="truncate text-lg font-semibold text-slate-950">
                                                            {submission.creator_name}
                                                        </p>
                                                        <span className="text-sm text-slate-400">
                                                            ID: {submission.id}
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600">
                                                            {productLabel}
                                                        </span>
                                                        <span>{formatStatusLabel(submission.status)}</span>
                                                        <span className="text-slate-300">|</span>
                                                        <span>{getSubmissionDateLabel(submission)}</span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                                        <p className="text-sm font-semibold text-slate-700">
                                            No submissions match these filters yet.
                                        </p>
                                        <p className="mt-2 text-sm text-slate-500">
                                            {hasActiveFilters
                                                ? "Clear the filters to see all approved content."
                                                : "Approved creator submissions will appear here once they are ready."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <aside className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(255,255,255,1))] p-5">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    Selected ({selectedSubmissions.length})
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Review the submission you want to carry into ad setup.
                                </p>
                            </div>

                            <div className="mt-5 space-y-3">
                                {selectedSubmission ? (
                                    <div className="rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {selectedSubmission.creator_name}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {getProductLabel(selectedSubmission)}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-5 text-sm text-slate-500">
                                        Select one approved submission to continue.
                                    </div>
                                )}
                            </div>

                            <MotionScale
                                type="button"
                                disabled={!selectedSubmission}
                                onClick={() => setStep(2)}
                                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(7,107,210,0.26)] transition hover:bg-[#0559AE] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                            >
                                Continue
                                <ArrowRightIcon />
                            </MotionScale>
                        </aside>
                    </div>
                </div>
            )}

            {step === 2 && selectedSubmission && (
                <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,_#fdfefe,_#f8fbff)] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:p-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-4">
                            <div className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                                            Step 2 of 3
                                        </p>
                                        <h2 className="mt-2 text-[1.2rem] font-semibold tracking-tight text-slate-950">
                                            Configure ads
                                        </h2>
                                        <p className="mt-2 text-sm text-slate-600">
                                            Set up campaign, ad preferences, creative, and
                                            landing details for the selected submission.
                                        </p>
                                    </div>

                                    <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                                        {isLoadingMeta
                                            ? "Loading Meta..."
                                            : selectedAdAccount
                                                ? selectedAdAccount.account_name
                                                : "Meta account required"}
                                    </div>
                                </div>

                                {message ? (
                                    <div className={cn(
                                        "mt-4 rounded-2xl border px-4 py-3 text-sm",
                                        messageClassName,
                                    )}>
                                        {message}
                                    </div>
                                ) : null}
                            </div>

                            {!connection || !selectedAdAccount ? (
                                <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                                    <h3 className="text-lg font-semibold text-slate-950">
                                        Connect Meta before creating an ad set
                                    </h3>
                                    <p className="mt-2 text-sm leading-7 text-slate-500">
                                        This builder needs a connected Meta account and a selected
                                        ad account before it can launch campaigns, ad sets, or ads.
                                    </p>
                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <Link
                                            href="/dashboard/integrations"
                                            className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition hover:bg-[#0559AE]"
                                        >
                                            Go to Integrations
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                        >
                                            Back
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <SectionCard
                                        title="Campaign"
                                        hint="Create the Meta campaign shell that this ad will launch into."
                                        action={
                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                New campaign
                                            </span>
                                        }
                                    >
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    Campaign name
                                                </span>
                                                <input
                                                    required
                                                    value={campaignForm.name}
                                                    onChange={(event) =>
                                                        setCampaignForm((current) => ({
                                                            ...current,
                                                            name: event.target.value,
                                                        }))
                                                    }
                                                    placeholder="Creator Traffic Launch"
                                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                                                />
                                            </label>

                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    Objective
                                                </span>
                                                <select
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
                                                        <option
                                                            key={objective.value}
                                                            value={objective.value}
                                                        >
                                                            {objective.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>

                                        {/* <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Full ad launch currently works best with the Traffic
                      objective, which matches your current backend rules.
                    </div> */}
                                    </SectionCard>

                                    <SectionCard
                                        title="Ad set"
                                        hint="Budget, targeting, and ad-set level setup for this launch."
                                    >
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    Ad set name
                                                </span>
                                                <input
                                                    value={campaignForm.adSetName}
                                                    onChange={(event) =>
                                                        setCampaignForm((current) => ({
                                                            ...current,
                                                            adSetName: event.target.value,
                                                        }))
                                                    }
                                                    placeholder="Creator Launch Ad Set"
                                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                                                />
                                            </label>

                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    Daily budget
                                                </span>
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    min="0"
                                                    step="1"
                                                    value={campaignForm.dailyBudget}
                                                    onChange={(event) =>
                                                        setCampaignForm((current) => ({
                                                            ...current,
                                                            dailyBudget: event.target.value,
                                                        }))
                                                    }
                                                    placeholder="50"
                                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                                                />
                                            </label>
                                        </div>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-600">
                                                Target countries
                                            </span>
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
                                        </label>
                                    </SectionCard>

                                    <SectionCard
                                        title="Ad name + identity"
                                        hint="Name the ad and connect the Meta Page identity it should use."
                                    >
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    Ad name
                                                </span>
                                                <input
                                                    value={campaignForm.adName}
                                                    onChange={(event) =>
                                                        setCampaignForm((current) => ({
                                                            ...current,
                                                            adName: event.target.value,
                                                        }))
                                                    }
                                                    placeholder="Creator Product Ad"
                                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                                                />
                                            </label>

                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    Meta Page ID
                                                </span>
                                                <input
                                                    value={campaignForm.pageId}
                                                    onChange={(event) =>
                                                        setCampaignForm((current) => ({
                                                            ...current,
                                                            pageId: event.target.value,
                                                        }))
                                                    }
                                                    placeholder="1234567890"
                                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                                                />
                                            </label>
                                        </div>
                                    </SectionCard>

                                    <SectionCard
                                        title="Copy"
                                        hint="Choose the creator asset and set the ad text that will appear in Meta."
                                    >
                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-600">
                                                Creative source
                                            </span>
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
                                                <option value="">Select creator asset or link</option>
                                                {creativeSourceOptions.map((option) => (
                                                    <option
                                                        key={option.key}
                                                        value={option.key}
                                                    >
                                                        {option.label} - {option.hint}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-600">
                                                Primary text
                                            </span>
                                            <textarea
                                                rows={4}
                                                value={campaignForm.primaryText}
                                                onChange={(event) =>
                                                    setCampaignForm((current) => ({
                                                        ...current,
                                                        primaryText: event.target.value,
                                                    }))
                                                }
                                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                                            />
                                        </label>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    Headline
                                                </span>
                                                <input
                                                    value={campaignForm.headline}
                                                    onChange={(event) =>
                                                        setCampaignForm((current) => ({
                                                            ...current,
                                                            headline: event.target.value,
                                                        }))
                                                    }
                                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                                                />
                                            </label>

                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    Description
                                                </span>
                                                <input
                                                    value={campaignForm.description}
                                                    onChange={(event) =>
                                                        setCampaignForm((current) => ({
                                                            ...current,
                                                            description: event.target.value,
                                                        }))
                                                    }
                                                    placeholder="Optional"
                                                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                                                />
                                            </label>
                                        </div>
                                    </SectionCard>

                                    <SectionCard
                                        title="Landing page + CTA"
                                        hint="Attach your destination URL, tracked link, and call to action."
                                    >
                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-slate-600">
                                                Destination URL
                                            </span>
                                            <input
                                                value={campaignForm.destinationUrl}
                                                onChange={(event) =>
                                                    setCampaignForm((current) => ({
                                                        ...current,
                                                        destinationUrl: event.target.value,
                                                    }))
                                                }
                                                placeholder="https://brand-store.com/products/landing-page"
                                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                                            />
                                        </label>

                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    UTM source
                                                </span>
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
                                            </label>

                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    UTM medium
                                                </span>
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
                                            </label>

                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    UTM campaign
                                                </span>
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
                                            </label>

                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    UTM content
                                                </span>
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
                                            </label>

                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    UTM term
                                                </span>
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
                                            </label>

                                            <label className="space-y-2">
                                                <span className="text-sm font-medium text-slate-600">
                                                    Call to action
                                                </span>
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
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                Tracking preview
                                            </p>
                                            <p className="mt-2 break-all text-sm text-slate-600">
                                                {trackingUrlPreview || "Add a destination URL to see the tracked link preview."}
                                            </p>
                                        </div>
                                    </SectionCard>

                                    <SectionCard
                                        title="Launch as"
                                        hint="Choose whether this goes out paused for review or active immediately."
                                    >
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {[
                                                {
                                                    value: "PAUSED",
                                                    label: "Paused",
                                                    hint: "Safer for review before launch.",
                                                    tone:
                                                        "border-amber-200 bg-amber-50 text-amber-800",
                                                },
                                                {
                                                    value: "ACTIVE",
                                                    label: "Active",
                                                    hint: "Launches immediately after creation.",
                                                    tone:
                                                        "border-emerald-200 bg-emerald-50 text-emerald-800",
                                                },
                                            ].map((option) => {
                                                const isActive = campaignForm.status === option.value;

                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() =>
                                                            setCampaignForm((current) => ({
                                                                ...current,
                                                                status: option.value,
                                                            }))
                                                        }
                                                        className={cn(
                                                            "rounded-[20px] border px-4 py-4 text-left transition",
                                                            isActive
                                                                ? option.tone
                                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                                                        )}
                                                    >
                                                        <p className="text-sm font-semibold">
                                                            {option.label}
                                                        </p>
                                                        <p className="mt-1 text-xs">{option.hint}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </SectionCard>

                                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-5 py-4">
                                        <div className="space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                                            >
                                                Back
                                            </button>
                                            {/* {!canProceedToReview ? (
                                                <p className="text-xs text-amber-700">
                                                    Fill these first: {missingReviewFields.slice(0, 3).join(", ")}
                                                    {missingReviewFields.length > 3 ? "..." : ""}
                                                </p>
                                            ) : null} */}
                                        </div>

                                        <MotionScale
                                            type="button"
                                            disabled={!canProceedToReview}
                                            onClick={() => setStep(3)}
                                            className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(7,107,210,0.26)] transition hover:bg-[#0559AE] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                                        >
                                            Review
                                        </MotionScale>
                                    </div>
                                </>
                            )}
                        </div>

                        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                            <p className="text-sm font-semibold text-slate-900">
                                Selected submission
                            </p>
                            <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-200">
                                        {selectedPreviewAsset?.signed_url && !selectedPreviewFailed ? (
                                            <img
                                                src={selectedPreviewAsset.signed_url}
                                                alt={selectedSubmission.creator_name}
                                                className="h-full w-full object-cover"
                                                onError={() => setSelectedPreviewFailed(true)}
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-400">
                                                {selectedSubmission.creator_name
                                                    .slice(0, 1)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-950">
                                            {selectedSubmission.creator_name}
                                        </p>
                                        <p className="truncate text-sm text-slate-500">
                                            {getProductLabel(selectedSubmission)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
                                    <div className="flex justify-between gap-3">
                                        <span>ID</span>
                                        <span className="truncate text-slate-900">
                                            {selectedSubmission.id}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span>Status</span>
                                        <span className="text-slate-900">
                                            {formatStatusLabel(selectedSubmission.status)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span>Creative</span>
                                        <span className="truncate text-right text-slate-900">
                                            {selectedCreativeSourceOption?.label || "Not selected"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fbff)] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Launch summary
                                </p>
                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex justify-between gap-3">
                                        <span>Objective</span>
                                        <span className="text-slate-900">
                                            {formatMetaStatus(campaignForm.objective)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span>Ad account</span>
                                        <span className="text-right text-slate-900">
                                            {selectedAdAccount?.account_name || "Not connected"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span>Launch status</span>
                                        <span className="text-slate-900">
                                            {formatMetaStatus(campaignForm.status)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span>Campaigns synced</span>
                                        <span className="text-slate-900">{campaigns.length}</span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            )}

            {step === 3 && selectedSubmission && (
                <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,_#fdfefe,_#f8fbff)] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:p-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-4">
                            <div className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                                            Step 3 of 3
                                        </p>
                                        <h2 className="mt-2 text-[1.2rem] font-semibold tracking-tight text-slate-950">
                                            Review & launch
                                        </h2>
                                        <p className="mt-2 text-sm text-slate-600">
                                            Final check before creating your Meta campaign and ad setup.
                                        </p>
                                    </div>

                                    <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                                        {formatMetaStatus(campaignForm.status)}
                                    </div>
                                </div>

                                {message ? (
                                    <div className={cn(
                                        "mt-4 rounded-2xl border px-4 py-3 text-sm",
                                        messageClassName,
                                    )}>
                                        {message}
                                    </div>
                                ) : null}
                            </div>

                            <SectionCard
                                title="Summary"
                                hint="This is the exact configuration that will be sent to Meta."
                            >
                                <div className="space-y-3 text-sm text-slate-600">
                                    <div>
                                        <span className="font-semibold text-slate-900">Campaign:</span>{" "}
                                        {campaignForm.name || "Not set"}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-900">Objective:</span>{" "}
                                        {formatMetaStatus(campaignForm.objective)}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-900">Ad set:</span>{" "}
                                        {campaignForm.adSetName || "Campaign shell only"}
                                        {campaignForm.dailyBudget
                                            ? ` - $${campaignForm.dailyBudget}/day`
                                            : ""}
                                        {campaignForm.countries
                                            ? ` - ${campaignForm.countries}`
                                            : ""}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-900">Identity:</span>{" "}
                                        {campaignForm.pageId
                                            ? `Brand page ${campaignForm.pageId}`
                                            : "No page selected yet"}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-900">Copy:</span>{" "}
                                        {campaignForm.headline || "No headline"} /{" "}
                                        {campaignForm.primaryText
                                            ? "Primary text added"
                                            : "No primary text"}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-900">Landing:</span>{" "}
                                        {campaignForm.destinationUrl || "No URL added"}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-900">CTA:</span>{" "}
                                        {callToActionOptions.find(
                                            (option) =>
                                                option.value === campaignForm.callToActionType,
                                        )?.label || "Learn More"}
                                    </div>
                                </div>
                            </SectionCard>

                            <SectionCard
                                title="Ad being created"
                                hint="This selected submission will be used to generate the Meta launch."
                            >
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {campaignForm.adName || `${selectedSubmission.creator_name} Ad`}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {selectedSubmission.creator_name} - {getProductLabel(selectedSubmission)}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                            Ready
                                        </span>
                                    </div>
                                </div>
                            </SectionCard>

                            <div className="rounded-[24px] border border-[rgba(7,107,210,0.14)] bg-[rgba(7,107,210,0.06)] px-5 py-4 text-sm text-slate-600">
                                {campaignForm.status === "PAUSED"
                                    ? "Ads will be created in Meta but remain paused until you activate them."
                                    : "Ads will be created in Meta and can start running immediately after launch."}
                            </div>
                        </div>

                        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                            <p className="text-sm font-semibold text-slate-900">
                                Selected (1)
                            </p>
                            <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-900">
                                    {selectedSubmission.creator_name}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    {getProductLabel(selectedSubmission)}
                                </p>
                            </div>

                            <div className="mt-5 flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Back
                                </button>

                                <MotionScale
                                    type="button"
                                    onClick={() => {
                                        void submitCampaign();
                                    }}
                                    disabled={isSubmittingCampaign || !canProceedToReview}
                                    className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(7,107,210,0.26)] transition hover:bg-[#0559AE] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                                >
                                    {isSubmittingCampaign
                                        ? "Launching..."
                                        : executionIntent
                                            ? "Launch ad"
                                            : "Create campaign"}
                                </MotionScale>
                            </div>

                            {!canProceedToReview ? (
                                <p className="mt-4 text-xs text-amber-700">
                                    Launch is locked until all required setup fields are completed.
                                </p>
                            ) : null}

                            {!isSubmittingCampaign && message?.toLowerCase().includes("created") ? (
                                <Link
                                    href="/dashboard/ads"
                                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Go to Ads
                                </Link>
                            ) : null}
                        </aside>
                    </div>
                </div>
            )}
        </div>
    );
}
