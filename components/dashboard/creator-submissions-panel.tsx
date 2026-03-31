"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SubmissionAssetsGallery } from "@/components/dashboard/submission-assets-gallery";
import type {
  CreatorApplicationSummary,
  CreatorSubmissionSummary,
  SubmissionStatus,
} from "@/lib/types";
import { cn, formatCurrency, formatDate, formatFileSize } from "@/lib/utils";

type CreatorSubmissionsPanelProps = {
  opportunities: CreatorApplicationSummary[];
  submissions: CreatorSubmissionSummary[];
};

type DraftState = Record<
  string,
  {
    links: string;
    notes: string;
    files: File[];
  }
>;

function getStatusLabel(status?: SubmissionStatus | null) {
  if (status === "revision_requested") {
    return "Revision requested";
  }

  if (status === "approved") {
    return "Approved";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  if (status === "submitted") {
    return "Submitted";
  }

  return "Ready to submit";
}

function getStatusClasses(status?: SubmissionStatus | null) {
  if (status === "revision_requested") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "bg-rose-50 text-rose-700";
  }

  if (status === "submitted") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-600";
}

export function CreatorSubmissionsPanel({
  opportunities,
  submissions,
}: CreatorSubmissionsPanelProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftState>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(null);
  const [isRefreshing, startRefresh] = useTransition();

  const submissionMap = useMemo(
    () => new Map(submissions.map((submission) => [submission.campaign_id, submission])),
    [submissions],
  );

  async function handleSubmit(application: CreatorApplicationSummary) {
    const draft = drafts[application.campaign_id];
    const submission = submissionMap.get(application.campaign_id) ?? null;
    const links = (draft?.links ?? submission?.content_links.join("\n") ?? "")
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
    const notes = (draft?.notes ?? submission?.notes ?? "").trim();
    const files = draft?.files ?? [];

    if (!links.length && !files.length) {
      setFeedback((current) => ({
        ...current,
        [application.campaign_id]:
          "Add at least one content link or uploaded file before submitting.",
      }));
      return;
    }

    setPendingCampaignId(application.campaign_id);
    setFeedback((current) => ({ ...current, [application.campaign_id]: "" }));

    try {
      const formData = new FormData();
      formData.append("campaignId", application.campaign_id);
      formData.append("notes", notes);
      formData.append("contentLinks", JSON.stringify(links));
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to submit deliverables.");
      }

      setFeedback((current) => ({
        ...current,
        [application.campaign_id]: "Submission sent. Refreshing workspace...",
      }));
      setDrafts((current) => ({
        ...current,
        [application.campaign_id]: {
          links: draft?.links ?? "",
          notes: draft?.notes ?? "",
          files: [],
        },
      }));
      startRefresh(() => {
        router.refresh();
      });
    } catch (error) {
      setFeedback((current) => ({
        ...current,
        [application.campaign_id]:
          error instanceof Error ? error.message : "Unable to submit deliverables.",
      }));
    } finally {
      setPendingCampaignId(null);
    }
  }

  if (!opportunities.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {opportunities.map((application) => {
        const submission = submissionMap.get(application.campaign_id) ?? null;
        const canSubmit =
          !submission || submission.status === "revision_requested";
        const linksValue =
          drafts[application.campaign_id]?.links ??
          submission?.content_links.join("\n") ??
          "";
        const notesValue =
          drafts[application.campaign_id]?.notes ?? submission?.notes ?? "";
        const selectedFiles = drafts[application.campaign_id]?.files ?? [];

        return (
          <div
            key={application.id}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-semibold text-slate-950">
                    {application.campaign_title}
                  </h3>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      getStatusClasses(submission?.status),
                    )}
                  >
                    {getStatusLabel(submission?.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium text-accent">
                  {application.brand_name}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {application.campaign_description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {application.platforms.map((platform) => (
                    <span
                      key={platform}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid min-w-[260px] gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Rate</span>
                  <span className="font-semibold text-slate-950">
                    {formatCurrency(application.rate)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Deliverables</span>
                  <span className="max-w-[150px] text-right font-medium text-slate-950">
                    {application.deliverables}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Content type</span>
                  <span className="max-w-[150px] text-right font-medium text-slate-950">
                    {application.content_type}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Deadline</span>
                  <span className="max-w-[150px] text-right font-medium text-slate-950">
                    {application.deadline
                      ? formatDate(application.deadline)
                      : "Flexible"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Timeline</span>
                  <span className="font-medium text-slate-950">
                    {application.duration}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Latest status</span>
                  <span className="font-medium text-slate-950">
                    {submission?.submitted_at
                      ? formatDate(submission.submitted_at)
                      : "Not submitted yet"}
                  </span>
                </div>
              </div>
            </div>

            {(application.product_name ||
              application.product_details ||
              application.usage_rights ||
              application.creator_requirements) && (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.5rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Product
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {application.product_name || "Shared in brief"}
                  </p>
                  {application.product_details ? (
                    <p className="mt-2 leading-7">{application.product_details}</p>
                  ) : null}
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Usage rights
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {application.usage_rights || "To be confirmed"}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                    Creator requirements
                  </p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {application.creator_requirements || "Open brief"}
                  </p>
                </div>
              </div>
            )}

            {submission?.feedback ? (
              <div className="mt-5 rounded-[1.5rem] bg-amber-50 px-4 py-4 text-sm text-amber-800">
                <p className="font-medium">Brand feedback</p>
                <p className="mt-2 leading-7">{submission.feedback}</p>
              </div>
            ) : null}

            {submission?.content_links.length ? (
              <div className="mt-5 rounded-[1.5rem] border border-slate-200 px-4 py-4">
                <p className="text-sm font-medium text-slate-900">Submitted links</p>
                <div className="mt-3 flex flex-col gap-2">
                  {submission.content_links.map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm text-accent hover:text-blue-500"
                    >
                      {link}
                    </a>
                  ))}
                </div>
                {submission.notes ? (
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {submission.notes}
                  </p>
                ) : null}
              </div>
            ) : null}

            {submission?.assets.length ? (
              <div className="mt-5">
                <SubmissionAssetsGallery
                  assets={submission.assets}
                  emptyLabel="No uploaded files for this submission yet."
                />
              </div>
            ) : null}

            {canSubmit ? (
              <div className="mt-5 grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div>
                  <label
                    htmlFor={`links-${application.campaign_id}`}
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    Content links
                  </label>
                  <textarea
                    id={`links-${application.campaign_id}`}
                    rows={4}
                    value={linksValue}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [application.campaign_id]: {
                          links: event.target.value,
                          notes:
                            current[application.campaign_id]?.notes ?? notesValue,
                          files:
                            current[application.campaign_id]?.files ?? selectedFiles,
                        },
                      }))
                    }
                    placeholder="Add one drive, Loom, or hosted content link per line."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`notes-${application.campaign_id}`}
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    Submission notes
                  </label>
                  <textarea
                    id={`notes-${application.campaign_id}`}
                    rows={3}
                    value={notesValue}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [application.campaign_id]: {
                          links:
                            current[application.campaign_id]?.links ?? linksValue,
                          notes: event.target.value,
                          files:
                            current[application.campaign_id]?.files ?? selectedFiles,
                        },
                      }))
                    }
                    placeholder="Mention version notes, hooks, or anything the brand should review."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`files-${application.campaign_id}`}
                    className="mb-2 block text-sm font-medium text-slate-600"
                  >
                    Upload assets
                  </label>
                  <input
                    id={`files-${application.campaign_id}`}
                    type="file"
                    multiple
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [application.campaign_id]: {
                          links:
                            current[application.campaign_id]?.links ?? linksValue,
                          notes:
                            current[application.campaign_id]?.notes ?? notesValue,
                          files: Array.from(event.target.files ?? []),
                        },
                      }))
                    }
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Upload up to 10 files, 25 MB each. You can mix images, videos, PDFs, and packaged deliverables.
                  </p>
                  {selectedFiles.length ? (
                    <div className="mt-3 grid gap-2 rounded-[1.25rem] border border-slate-200 bg-white p-3">
                      {selectedFiles.map((file) => (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="flex items-center justify-between gap-3 text-sm text-slate-600"
                        >
                          <span className="truncate">{file.name}</span>
                          <span className="shrink-0 text-xs text-slate-400">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    {submission?.status === "revision_requested"
                      ? "Update links or upload a new revision package before resubmitting."
                      : "Send links and uploaded assets once all deliverables are ready."}
                  </p>
                  <button
                    type="button"
                    disabled={pendingCampaignId === application.campaign_id}
                    onClick={() => void handleSubmit(application)}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingCampaignId === application.campaign_id
                      ? "Submitting..."
                      : submission
                        ? "Resubmit deliverables"
                        : "Submit deliverables"}
                  </button>
                </div>
              </div>
            ) : null}

            {feedback[application.campaign_id] ? (
              <p className="mt-4 text-sm text-slate-500">
                {feedback[application.campaign_id]}
              </p>
            ) : null}
          </div>
        );
      })}

      {isRefreshing ? (
        <p className="text-sm text-slate-500">Refreshing submissions...</p>
      ) : null}
    </div>
  );
}
