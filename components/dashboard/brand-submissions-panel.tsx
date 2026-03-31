"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

function TableStatusBadge({
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

function TableFilters({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  campaignValue,
  onCampaignChange,
  statusOptions,
  campaignOptions,
  searchPlaceholder,
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
}) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <input
        type="search"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)] xl:max-w-md"
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:w-auto">
        <select
          value={statusValue}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
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
          className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
        >
          <option value="all">All campaigns</option>
          {campaignOptions.map((campaign) => (
            <option key={campaign} value={campaign}>
              {campaign}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function EmptyTableState({ label }: { label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
      {label}
    </div>
  );
}

export function BrandSubmissionsPanel({
  applications,
  submissions,
}: BrandSubmissionsPanelProps) {
  const [activeTab, setActiveTab] = useState<"queue" | "deliveries">("queue");
  const [queueSearch, setQueueSearch] = useState("");
  const [queueStatus, setQueueStatus] = useState<ApplicationStatus | "all">("all");
  const [queueCampaign, setQueueCampaign] = useState("all");
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<SubmissionStatus | "all">("all");
  const [deliveryCampaign, setDeliveryCampaign] = useState("all");

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
    () => [...new Set(applications.map((application) => application.campaign_title))].sort(),
    [applications],
  );
  const deliveryCampaignOptions = useMemo(
    () => [...new Set(submissions.map((submission) => submission.campaign_title))].sort(),
    [submissions],
  );

  const filteredApplications = useMemo(() => {
    const search = queueSearch.trim().toLowerCase();

    return applications.filter((application) => {
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
  }, [applications, queueCampaign, queueSearch, queueStatus]);

  const filteredSubmissions = useMemo(() => {
    const search = deliverySearch.trim().toLowerCase();

    return submissions.filter((submission) => {
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
  }, [deliveryCampaign, deliverySearch, deliveryStatus, submissions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {[
          {
            key: "queue" as const,
            label: "Queue",
            value: `${applications.length} items`,
          },
          {
            key: "deliveries" as const,
            label: "Deliveries",
            value: `${submissions.length} items`,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-semibold transition",
              activeTab === tab.key
                ? "border-transparent bg-[color:#076BD2] text-white shadow-[0_16px_34px_rgba(7,107,210,0.18)]"
                : "border-slate-200 bg-white text-slate-600 hover:border-accent/20 hover:bg-[rgba(7,107,210,0.05)] hover:text-accent",
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs",
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

      {activeTab === "queue" ? (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                Submission Queue
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Review pitches in a structured queue, then open the detail page for
                full creator and campaign context.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-[rgba(7,107,210,0.1)] px-3 py-1 font-medium text-accent">
                {applications.length} total
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                {applications.filter((application) => application.status === "pending").length} pending
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                {applications.filter((application) => application.status === "accepted").length} accepted
              </span>
            </div>
          </div>

          <div className="mt-6">
            <TableFilters
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
                { value: "all", label: "All statuses" },
                { value: "pending", label: "Pending" },
                { value: "shortlisted", label: "Shortlisted" },
                { value: "accepted", label: "Accepted" },
                { value: "declined", label: "Declined" },
              ]}
              campaignOptions={queueCampaignOptions}
            />
          </div>

          <div className="mt-6 overflow-x-auto">
            {filteredApplications.length ? (
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Creator</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Campaign</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Pitch</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Rate</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Status</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Submitted</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Delivery</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application) => {
                    const linkedSubmission = submissionsByApplicationKey.get(
                      buildApplicationKey(application.campaign_id, application.creator_id),
                    );

                    return (
                      <tr key={application.id} className="align-top text-slate-700">
                        <td className="border-b border-slate-100 px-4 py-4">
                          <div>
                            <p className="font-semibold text-slate-950">
                              {application.creator_name}
                            </p>
                            <p className="mt-1 max-w-[16rem] text-sm text-slate-500">
                              {application.creator_headline ?? "Creator profile in review"}
                            </p>
                          </div>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4">
                          <div className="max-w-[14rem]">
                            <p className="font-medium text-slate-950">
                              {application.campaign_title}
                            </p>
                          </div>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4">
                          <p className="max-w-[24rem] text-sm leading-6 text-slate-600">
                            {application.pitch}
                          </p>
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 font-medium text-slate-950">
                          {formatCurrency(application.rate)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4">
                          <TableStatusBadge
                            className={getApplicationStatusClasses(application.status)}
                            label={formatStatusLabel(application.status)}
                          />
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4 text-slate-500">
                          {formatDate(application.created_at)}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4">
                          {linkedSubmission ? (
                            <div className="space-y-2">
                              <TableStatusBadge
                                className={getSubmissionStatusClasses(linkedSubmission.status)}
                                label={formatStatusLabel(linkedSubmission.status)}
                              />
                              <Link
                                href={`/dashboard/submissions/deliveries/${linkedSubmission.id}`}
                                className="block text-xs font-semibold text-accent transition hover:text-[#0559AE]"
                              >
                                Open delivery
                              </Link>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">Not submitted</span>
                          )}
                        </td>
                        <td className="border-b border-slate-100 px-4 py-4">
                          <div className="flex min-w-[170px] flex-col gap-2">
                            <Link
                              href={`/dashboard/submissions/queue/${application.id}`}
                              className="inline-flex h-9 items-center justify-center rounded-xl border border-accent/15 bg-[rgba(7,107,210,0.06)] px-3 text-xs font-semibold text-accent transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.1)]"
                            >
                              Open detail
                            </Link>
                            <BrandApplicationActionButtons
                              applicationId={application.id}
                              status={application.status}
                              variant="table"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyTableState label="No applications match the current filters." />
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-[2rem] font-semibold tracking-tight text-slate-950">
                Content Deliveries
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Filter live deliveries, handle quick approvals in-table, and move
                into the detail page when you need the full submission review flow.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-[rgba(7,107,210,0.1)] px-3 py-1 font-medium text-accent">
                {submissions.length} total
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                {submissions.filter((submission) => submission.status === "revision_requested").length} revisions
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                {submissions.filter((submission) => submission.status === "approved").length} approved
              </span>
            </div>
          </div>

          <div className="mt-6">
            <TableFilters
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
            />
          </div>

          <div className="mt-6 overflow-x-auto">
            {filteredSubmissions.length ? (
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Creator</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Campaign</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Revision</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Submitted</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Assets</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Status</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Reviewed</th>
                    <th className="border-b border-slate-200 px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="align-top text-slate-700">
                      <td className="border-b border-slate-100 px-4 py-4">
                        <div>
                          <p className="font-semibold text-slate-950">
                            {submission.creator_name}
                          </p>
                          <p className="mt-1 max-w-[16rem] text-sm text-slate-500">
                            {submission.creator_headline ??
                              "Creator delivery ready for review"}
                          </p>
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <p className="max-w-[15rem] font-medium text-slate-950">
                          {submission.campaign_title}
                        </p>
                        {submission.notes ? (
                          <p className="mt-2 max-w-[18rem] text-sm leading-6 text-slate-500">
                            {submission.notes}
                          </p>
                        ) : null}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-slate-500">
                        Revision {submission.revision_number}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-slate-500">
                        {submission.submitted_at
                          ? formatDate(submission.submitted_at)
                          : formatDate(submission.created_at)}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-slate-500">
                        <div className="space-y-1">
                          <p>{submission.assets.length} files</p>
                          <p>{submission.content_links.length} links</p>
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <TableStatusBadge
                          className={getSubmissionStatusClasses(submission.status)}
                          label={formatStatusLabel(submission.status)}
                        />
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4 text-slate-500">
                        {submission.reviewed_at
                          ? formatDate(submission.reviewed_at)
                          : "Awaiting review"}
                      </td>
                      <td className="border-b border-slate-100 px-4 py-4">
                        <div className="flex min-w-[170px] flex-col gap-2">
                            <Link
                              href={`/dashboard/submissions/deliveries/${submission.id}`}
                              className="inline-flex h-9 items-center justify-center rounded-xl border border-accent/15 bg-[rgba(7,107,210,0.06)] px-3 text-xs font-semibold text-accent transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.1)]"
                            >
                              Open detail
                            </Link>
                          <BrandSubmissionActionButtons
                            submissionId={submission.id}
                            status={submission.status}
                            feedback={submission.feedback}
                            variant="table"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyTableState label="No deliveries match the current filters." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
