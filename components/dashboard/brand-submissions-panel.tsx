"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  BrandApplicationActionButtons,
  BrandSubmissionActionButtons,
} from "@/components/dashboard/brand-review-actions";
import type {
  ApplicationStatus,
  BrandApplicationSummary,
  BrandSubmissionSummary,
  SubmissionStatus,
} from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type BrandSubmissionsPanelProps = {
  applications: BrandApplicationSummary[];
  submissions: BrandSubmissionSummary[];
};

function getApplicationStatusClasses(status: ApplicationStatus) {
  if (status === "accepted") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "shortlisted") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "declined") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-[rgba(7,107,210,0.1)] text-accent";
}

function getSubmissionStatusClasses(status: SubmissionStatus) {
  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "revision_requested") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "rejected") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-[rgba(7,107,210,0.1)] text-accent";
}

function formatStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function buildApplicationKey(campaignId: string, creatorId: string) {
  return `${campaignId}:${creatorId}`;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({
  className,
  label,
}: {
  className: string;
  label: string;
}) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize", className)}>
      {label}
    </span>
  );
}

function FiltersBar({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  campaignValue,
  onCampaignChange,
  statusOptions,
  campaignOptions,
  searchPlaceholder,
  onExport,
  exportDisabled,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  campaignValue: string;
  onCampaignChange: (value: string) => void;
  statusOptions: Array<{ value: string; label: string }>;
  campaignOptions: string[];
  searchPlaceholder: string;
  onExport?: () => void;
  exportDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <input
        type="search"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className="h-10 w-full rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)] lg:max-w-[26rem]"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-1 lg:items-center">
        <select
          value={statusValue}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-10 min-w-[160px] rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={campaignValue}
          onChange={(event) => onCampaignChange(event.target.value)}
          className="h-10 min-w-[160px] rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
        >
          <option value="all">All campaigns</option>
          {campaignOptions.map((campaign) => (
            <option key={campaign} value={campaign}>
              {campaign}
            </option>
          ))}
        </select>
        {onExport ? (
          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#076BD2] px-4 text-sm font-semibold text-white transition hover:bg-[#065eb8] disabled:cursor-not-allowed disabled:bg-slate-300 lg:ml-auto"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 3v12" strokeLinecap="round" />
              <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 21h14" strokeLinecap="round" />
            </svg>
            Export
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
      {label}
    </div>
  );
}

function CreatorAvatar({ name }: { name: string }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-semibold uppercase text-[#2563eb]">
      {name.slice(0, 2)}
    </span>
  );
}

function TableShell({
  count,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  children,
}: {
  count: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  children: ReactNode;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const firstItem = count ? (page - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(page * pageSize, count);

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>{count} items</span>
        {/* <span>Newest first</span> */}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-left">
          {children}
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-accent/40"
            aria-label="Rows per page"
          >
            {[10, 25, 50].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3 sm:justify-end">
          <span>
            Showing {firstItem}-{lastItem} of {count}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-accent/30 hover:text-accent disabled:cursor-not-allowed disabled:text-slate-300"
              aria-label="Go to previous page"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="min-w-16 text-center font-medium text-slate-600">
              {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-accent/30 hover:text-accent disabled:cursor-not-allowed disabled:text-slate-300"
              aria-label="Go to next page"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationRow({
  application,
  linkedSubmission,
  onOpen,
}: {
  application: BrandApplicationSummary;
  linkedSubmission?: BrandSubmissionSummary;
  onOpen: () => void;
}) {
  return (
    <tr className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <CreatorAvatar name={application.creator_name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              @{application.creator_name}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {application.creator_headline ?? application.pitch}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="max-w-[14rem] truncate text-sm text-slate-700">
          {application.campaign_title}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          ID {application.id.slice(0, 8)}
        </p>
      </td>
      <td className="px-4 py-4">
        <StatusBadge
          className={getApplicationStatusClasses(application.status)}
          label={formatStatusLabel(application.status)}
        />
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
        {formatCurrency(application.rate)}
      </td>
      <td className="px-4 py-4 text-sm text-slate-500">
        {formatDate(application.created_at)}
      </td>
      <td className="px-4 py-4">
        <div>
          {linkedSubmission ? (
            <Link
              href={`/dashboard/submissions/deliveries/${linkedSubmission.id}`}
              className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/20 hover:text-accent"
            >
              Delivery: {formatStatusLabel(linkedSubmission.status)}
            </Link>
          ) : (
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              Not submitted
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <div className="inline-flex items-center gap-2">
          {/* <BrandApplicationActionButtons
            applicationId={application.id}
            status={application.status}
            variant="table"
          /> */}
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-accent/20 hover:text-accent"
          >
            Review
          </button>
        </div>
      </td>
    </tr>
  );
}

function SubmissionRow({
  submission,
  onOpen,
  exportMode,
  selected,
  onToggleSelected,
}: {
  submission: BrandSubmissionSummary;
  onOpen: () => void;
  exportMode: boolean;
  selected: boolean;
  onToggleSelected: () => void;
}) {
  const selectable = submission.status === "approved";

  return (
    <tr
      className={cn(
        "border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50",
        exportMode &&
        !selectable &&
        "bg-slate-50/70 opacity-50 hover:bg-slate-50/70",
        selected && "bg-[rgba(7,107,210,0.06)] hover:bg-[rgba(7,107,210,0.08)]",
      )}
    >
      {exportMode ? (
        <td className="w-12 px-4 py-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelected}
            disabled={!selectable}
            aria-label={`Select ${submission.creator_name} delivery`}
            className="h-4 w-4 rounded border-slate-300 accent-[#076BD2] disabled:cursor-not-allowed disabled:opacity-40"
          />
        </td>
      ) : null}
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <CreatorAvatar name={submission.creator_name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              @{submission.creator_name}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {submission.creator_headline ??
                submission.notes ??
                `Revision ${submission.revision_number}`}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="max-w-[14rem] truncate text-sm text-slate-700">
          {submission.campaign_title}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          ID {submission.id.slice(0, 8)}
        </p>
      </td>
      <td className="px-4 py-4">
        <StatusBadge
          className={getSubmissionStatusClasses(submission.status)}
          label={formatStatusLabel(submission.status)}
        />
      </td>
      {/* <td className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-500">
            {submission.assets.length} files
          </span>
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-500">
            {submission.content_links.length} links
          </span>
        </div>
      </td> */}
      <td className="px-4 py-4 text-sm text-slate-500">
        {submission.submitted_at
          ? formatDate(submission.submitted_at)
          : formatDate(submission.created_at)}
      </td>
      <td className="px-4 py-4 text-sm text-slate-500">
        {submission.reviewed_at
          ? `Reviewed ${formatDate(submission.reviewed_at)}`
          : `Revision ${submission.revision_number}`}
      </td>
      <td className="px-4 py-4 text-right">
        <div className="inline-flex items-center gap-2">
          {/* <BrandSubmissionActionButtons
            submissionId={submission.id}
            status={submission.status}
            feedback={submission.feedback}
            variant="table"
          /> */}
          <button
            type="button"
            onClick={onOpen}
            disabled={exportMode && !selectable}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-accent/20 hover:text-accent disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:border-slate-200"
          >
            Review
          </button>
        </div>
      </td>
    </tr>
  );
}

export function BrandSubmissionsPanel({
  applications,
  submissions,
}: BrandSubmissionsPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"queue" | "deliveries">("queue");
  const [reviewMode, setReviewMode] = useState(false);
  const [queueSearch, setQueueSearch] = useState("");
  const [queueStatus, setQueueStatus] = useState<ApplicationStatus | "all">("all");
  const [queueCampaign, setQueueCampaign] = useState("all");
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<SubmissionStatus | "all">("all");
  const [deliveryCampaign, setDeliveryCampaign] = useState("all");
  const [queuePage, setQueuePage] = useState(1);
  const [queuePageSize, setQueuePageSize] = useState(10);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveryPageSize, setDeliveryPageSize] = useState(10);
  const [exportMode, setExportMode] = useState(false);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<Set<string>>(
    () => new Set(),
  );

  const reviewApplications = useMemo(() => {
    if (!reviewMode) return applications;

    return applications.filter(
      (item) => item.status === "pending"
    );
  }, [applications, reviewMode]);


  const reviewSubmissions = useMemo(() => {
    if (!reviewMode) return submissions;

    return submissions.filter(
      (item) => item.status === "submitted"
    );
  }, [submissions, reviewMode]);
  const submissionsByApplicationKey = useMemo(
    () =>
      submissions.reduce((map, submission) => {
        map.set(
          buildApplicationKey(submission.campaign_id, submission.creator_id),
          submission,
        );
        return map;
      }, new Map<string, BrandSubmissionSummary>()),
    [submissions],
  );

  const queueCampaignOptions = useMemo(
    () => [...new Set(reviewApplications.map((application) => application.campaign_title))].sort(),
    [reviewApplications],
  );
  const deliveryCampaignOptions = useMemo(
    () => [...new Set(reviewSubmissions.map((submission) => submission.campaign_title))].sort(),
    [reviewSubmissions],
  );

  const filteredApplications = useMemo(() => {
    const search = queueSearch.trim().toLowerCase();

    return reviewApplications.filter((application) => {
      const matchesSearch =
        !search ||
        [
          application.creator_name,
          application.creator_headline ?? "",
          application.campaign_title,
          application.pitch,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesStatus =
        queueStatus === "all" || application.status === queueStatus;
      const matchesCampaign =
        queueCampaign === "all" || application.campaign_title === queueCampaign;

      return matchesSearch && matchesStatus && matchesCampaign;
    });
  }, [reviewApplications, queueCampaign, queueSearch, queueStatus]);

  const filteredSubmissions = useMemo(() => {
    const search = deliverySearch.trim().toLowerCase();

    return reviewSubmissions.filter((submission) => {
      const matchesSearch =
        !search ||
        [
          submission.creator_name,
          submission.creator_headline ?? "",
          submission.campaign_title,
          submission.notes ?? "",
          submission.feedback ?? "",
          submission.content_links.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search);
      const matchesStatus =
        deliveryStatus === "all" || submission.status === deliveryStatus;
      const matchesCampaign =
        deliveryCampaign === "all" ||
        submission.campaign_title === deliveryCampaign;

      return matchesSearch && matchesStatus && matchesCampaign;
    });
  }, [reviewSubmissions, deliveryCampaign, deliverySearch, deliveryStatus]);
  const paginatedApplications = useMemo(
    () =>
      filteredApplications.slice(
        (queuePage - 1) * queuePageSize,
        queuePage * queuePageSize,
      ),
    [filteredApplications, queuePage, queuePageSize],
  );
  const paginatedSubmissions = useMemo(
    () =>
      filteredSubmissions.slice(
        (deliveryPage - 1) * deliveryPageSize,
        deliveryPage * deliveryPageSize,
      ),
    [deliveryPage, deliveryPageSize, filteredSubmissions],
  );
  const exportableSubmissions = useMemo(
    () => filteredSubmissions.filter((submission) => submission.status === "approved"),
    [filteredSubmissions],
  );
  const selectedSubmissions = useMemo(
    () =>
      exportableSubmissions.filter((submission) =>
        selectedDeliveryIds.has(submission.id),
      ),
    [exportableSubmissions, selectedDeliveryIds],
  );

  useEffect(() => {
    setQueuePage(1);
  }, [queueCampaign, queueSearch, queueStatus, reviewMode]);

  useEffect(() => {
    setDeliveryPage(1);
  }, [deliveryCampaign, deliverySearch, deliveryStatus, reviewMode]);

  useEffect(() => {
    setQueuePage((page) =>
      Math.min(page, Math.max(1, Math.ceil(filteredApplications.length / queuePageSize))),
    );
  }, [filteredApplications.length, queuePageSize]);

  useEffect(() => {
    setDeliveryPage((page) =>
      Math.min(page, Math.max(1, Math.ceil(filteredSubmissions.length / deliveryPageSize))),
    );
  }, [deliveryPageSize, filteredSubmissions.length]);

  useEffect(() => {
    setSelectedDeliveryIds((selectedIds) => {
      const exportableIds = new Set(exportableSubmissions.map((submission) => submission.id));
      return new Set([...selectedIds].filter((id) => exportableIds.has(id)));
    });
  }, [exportableSubmissions]);

  useEffect(() => {
    if (activeTab === "queue") {
      setExportMode(false);
      setSelectedDeliveryIds(new Set());
    }
  }, [activeTab]);

  const pendingApplicants = applications.filter(
    (application) => application.status === "pending",
  ).length;
  const awaitingReview = submissions.filter(
    (submission) => submission.status === "submitted",
  ).length;
  const approvedValue = submissions
    .filter((submission) => submission.status === "approved")
    .reduce((sum, submission) => sum + submission.rate, 0);
  const activeCount =
    activeTab === "queue" ? filteredApplications.length : filteredSubmissions.length;
  const handleExport = () => {
    setExportMode(true);
    setSelectedDeliveryIds(new Set());
  };
  const handleExportCsv = () => {
    downloadCsv("content-deliveries.csv", [
      [
        "BRAND",
        "CREATOR",
        "INSTAGRAM",
        "TIKTOK",
        "PRODUCTS",
        "SCRIPT",
      ],
      ...selectedSubmissions.map((submission) => [
        submission.brand_name,
        submission.creator_name,
        submission.instagram_handle ?? "",
        submission.tiktok_handle ?? "",
        submission.product_name ?? "",
        submission.notes ?? "",
      ]),
    ]);
    setExportMode(false);
    setSelectedDeliveryIds(new Set());
  };
  const handleCancelExport = () => {
    setExportMode(false);
    setSelectedDeliveryIds(new Set());
  };
  const handleToggleDelivery = (submissionId: string) => {
    setSelectedDeliveryIds((selectedIds) => {
      const nextIds = new Set(selectedIds);

      if (nextIds.has(submissionId)) {
        nextIds.delete(submissionId);
      } else {
        nextIds.add(submissionId);
      }

      return nextIds;
    });
  };
  const handleToggleAllDeliveries = () => {
    if (selectedSubmissions.length === exportableSubmissions.length) {
      setSelectedDeliveryIds(new Set());
      return;
    }

    setSelectedDeliveryIds(
      new Set(exportableSubmissions.map((submission) => submission.id)),
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <h1 className="text-3xl font-medium">Submissions</h1>
          <p className="mt-2 text-sm text-slate-500">
            Review creator applications and submitted deliveries from one compact queue.
          </p>
        </div>
        <div className="sm:justify-self-end">
          <button
            type="button"
            onClick={() =>
              setReviewMode(
                !reviewMode
              )
            }

            className={cn(

              "flex items-center gap-4 rounded-2xl px-3 py-2 transition max-w-fit",

              reviewMode
                ? "bg-blue-600 text-white border border-blue-600"
                : "border border-slate-200 bg-white text-slate-900"

            )}
          >

            <span className="text-sm font-medium">

              New Uploads

            </span>


            <div
              className={cn(

                "relative h-6 w-11 rounded-full transition",

                reviewMode
                  ? "bg-white/20"
                  : "bg-slate-300"

              )}
            >

              <div
                className={cn(

                  "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",

                  reviewMode
                    ? "left-6"
                    : "left-1"

                )}
              />

            </div>

          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
          <p className="text-[1rem] font-medium text-slate-500">Pending applicants</p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {pendingApplicants}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
          <p className="text-[1rem] font-medium text-slate-500">Awaiting review</p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {awaitingReview}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
          <p className="text-[1rem] font-medium text-slate-500">Approved value</p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {formatCurrency(approvedValue)}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                {
                  key: "queue" as const,
                  label: "Queue",
                  value: reviewApplications.length,
                },
                {
                  key: "deliveries" as const,
                  label: "Deliveries",
                  value: reviewSubmissions.length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition",
                    activeTab === tab.key
                      ? "border-[#076BD2] bg-[#076BD2] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-accent/20 hover:bg-[rgba(7,107,210,0.05)] hover:text-accent",
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      activeTab === tab.key
                        ? "bg-white/10 text-white"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {tab.value}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 py-3">
            {activeTab === "queue" ? (
              <FiltersBar
                searchValue={queueSearch}
                onSearchChange={setQueueSearch}
                statusValue={queueStatus}
                onStatusChange={(value) =>
                  setQueueStatus(value as ApplicationStatus | "all")
                }
                campaignValue={queueCampaign}
                onCampaignChange={setQueueCampaign}
                searchPlaceholder="Search creator, campaign, or pitch"
                statusOptions={[
                  { value: "all", label: "All status" },
                  { value: "pending", label: "Pending" },
                  { value: "shortlisted", label: "Shortlisted" },
                  { value: "accepted", label: "Accepted" },
                  { value: "declined", label: "Declined" },
                ]}
                campaignOptions={queueCampaignOptions}
              />
            ) : (
              <FiltersBar
                searchValue={deliverySearch}
                onSearchChange={setDeliverySearch}
                statusValue={deliveryStatus}
                onStatusChange={(value) =>
                  setDeliveryStatus(value as SubmissionStatus | "all")
                }
                campaignValue={deliveryCampaign}
                onCampaignChange={setDeliveryCampaign}
                searchPlaceholder="Search creator, campaign, notes, or feedback"
                statusOptions={[
                  { value: "all", label: "All statuses" },
                  { value: "submitted", label: "Submitted" },
                  { value: "revision_requested", label: "Revision requested" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ]}
                campaignOptions={deliveryCampaignOptions}
                onExport={handleExport}
                exportDisabled={exportMode || !exportableSubmissions.length}
              />
            )}
          </div>
        </div>

        {activeTab === "queue" ? (
          <div className="space-y-4">
            <div className="min-w-0">
              {/* <p className="text-sm text-slate-500">
                {reviewApplications.length} submissions
                {" - "}
                {pendingApplicants} need a first look
              </p> */}
              <h2 className="mt-2 text-[1.4rem] font-semibold tracking-tight text-slate-950">
                Submission Queue
              </h2>
            </div>

            {filteredApplications.length ? (
              <TableShell
                count={activeCount}
                page={queuePage}
                pageSize={queuePageSize}
                onPageChange={setQueuePage}
                onPageSizeChange={(pageSize) => {
                  setQueuePageSize(pageSize);
                  setQueuePage(1);
                }}
              >
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Creator</th>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Delivery</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedApplications.map((application) => {
                    const linkedSubmission = submissionsByApplicationKey.get(
                      buildApplicationKey(application.campaign_id, application.creator_id),
                    );

                    return (
                      <ApplicationRow
                        key={application.id}
                        application={application}
                        linkedSubmission={linkedSubmission}
                        onOpen={() =>
                          router.push(`/dashboard/submissions/queue/${application.id}`)
                        }
                      />
                    );
                  })}
                </tbody>
              </TableShell>
            ) : (
              <EmptyState label="No applications match the current filters." />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="min-w-0">
              <h2 className="text-[1.4rem] font-semibold tracking-tight text-slate-950">
                Content Deliveries
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Filter live deliveries, handle quick approvals in-table, and move
                into the detail page when you need the full submission review flow.
              </p>
            </div>

            {exportMode ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={
                        !!exportableSubmissions.length &&
                        selectedSubmissions.length === exportableSubmissions.length
                      }
                      onChange={handleToggleAllDeliveries}
                      disabled={!exportableSubmissions.length}
                      className="h-4 w-4 rounded border-slate-300 accent-[#076BD2] disabled:cursor-not-allowed disabled:opacity-40"
                    />
                    Select all approved
                  </label>
                  <span className="h-5 w-px bg-slate-200" />
                  <span className="text-sm font-semibold text-slate-600">
                    {selectedSubmissions.length} selected
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={!selectedSubmissions.length}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#076BD2] px-4 text-sm font-semibold text-white transition hover:bg-[#065eb8] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelExport}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-accent/20 hover:text-accent"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {filteredSubmissions.length ? (
              <TableShell
                count={activeCount}
                page={deliveryPage}
                pageSize={deliveryPageSize}
                onPageChange={setDeliveryPage}
                onPageSizeChange={(pageSize) => {
                  setDeliveryPageSize(pageSize);
                  setDeliveryPage(1);
                }}
              >
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    {exportMode ? <th className="w-12 px-4 py-3">Select</th> : null}
                    <th className="px-4 py-3">Creator</th>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Status</th>
                    {/* <th className="px-4 py-3">Assets</th> */}
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Review</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedSubmissions.map((submission) => (
                    <SubmissionRow
                      key={submission.id}
                      submission={submission}
                      exportMode={exportMode}
                      selected={selectedDeliveryIds.has(submission.id)}
                      onToggleSelected={() => handleToggleDelivery(submission.id)}
                      onOpen={() =>
                        router.push(`/dashboard/submissions/deliveries/${submission.id}`)
                      }
                    />
                  ))}
                </tbody>
              </TableShell>
            ) : (
              <EmptyState label="No deliveries match the current filters." />
            )}
          </div>
        )}
      </div>
    </>

  );
}
