"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationStatus, SubmissionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type ActionVariant = "table" | "detail";

type BrandApplicationActionButtonsProps = {
  applicationId: string;
  status: ApplicationStatus;
  variant?: ActionVariant;
};

type BrandSubmissionActionButtonsProps = {
  submissionId: string;
  status: SubmissionStatus;
  feedback?: string | null;
  variant?: ActionVariant;
};

const primaryActionClassName =
  "border-transparent bg-[color:#076BD2] text-white shadow-[0_14px_32px_rgba(7,107,210,0.2)] hover:bg-[#0559AE]";

function getApplicationActionMeta(status: ApplicationStatus) {
  switch (status) {
    case "shortlisted":
      return {
        label: "Shortlist",
        className:
          "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
      };
    case "accepted":
      return {
        label: "Accept",
        className: primaryActionClassName,
      };
    case "declined":
      return {
        label: "Decline",
        className:
          "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      };
    default:
      return {
        label: "Update",
        className:
          "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      };
  }
}

function getSubmissionActionMeta(status: SubmissionStatus) {
  switch (status) {
    case "revision_requested":
      return {
        label: "Request revision",
        className:
          "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
      };
    case "approved":
      return {
        label: "Approve",
        className: primaryActionClassName,
      };
    case "rejected":
      return {
        label: "Reject",
        className:
          "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      };
    default:
      return {
        label: "Update",
        className:
          "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      };
  }
}

function getQuickApplicationStatus(status: ApplicationStatus) {
  if (status === "pending") {
    return "shortlisted" as const;
  }

  if (status === "shortlisted") {
    return "accepted" as const;
  }

  return null;
}

function getQuickSubmissionStatus(status: SubmissionStatus) {
  if (status === "approved" || status === "rejected") {
    return null;
  }

  return "approved" as const;
}

export function BrandApplicationActionButtons({
  applicationId,
  status,
  variant = "detail",
}: BrandApplicationActionButtonsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(null);
  const quickStatus = getQuickApplicationStatus(status);

  async function updateApplication(nextStatus: ApplicationStatus) {
    setPendingStatus(nextStatus);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update application.");
      }

      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update application.",
      );
    } finally {
      setPendingStatus(null);
    }
  }

  if (variant === "table") {
    if (!quickStatus) {
      return (
        <span className="text-xs font-medium text-slate-400">
          {status === "accepted" ? "Accepted" : status === "declined" ? "Declined" : "Reviewed"}
        </span>
      );
    }

    const actionMeta = getApplicationActionMeta(quickStatus);

    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void updateApplication(quickStatus)}
          disabled={pendingStatus !== null}
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
            actionMeta.className,
          )}
        >
          {pendingStatus === quickStatus ? "Updating..." : actionMeta.label}
        </button>
        {error ? <p className="max-w-[12rem] text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {(["shortlisted", "accepted", "declined"] as ApplicationStatus[]).map(
          (nextStatus) => {
            const actionMeta = getApplicationActionMeta(nextStatus);

            return (
              <button
                key={nextStatus}
                type="button"
                onClick={() => void updateApplication(nextStatus)}
                disabled={pendingStatus !== null || status === nextStatus}
                className={cn(
                  "inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                  actionMeta.className,
                )}
              >
                {pendingStatus === nextStatus ? "Updating..." : actionMeta.label}
              </button>
            );
          },
        )}
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}

export function BrandSubmissionActionButtons({
  submissionId,
  status,
  feedback,
  variant = "detail",
}: BrandSubmissionActionButtonsProps) {
  const router = useRouter();
  const [feedbackInput, setFeedbackInput] = useState(feedback ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<SubmissionStatus | null>(null);
  const quickStatus = getQuickSubmissionStatus(status);
  const isFinal = status === "approved" || status === "rejected";

  useEffect(() => {
    setFeedbackInput(feedback ?? "");
  }, [feedback]);

  async function updateSubmission(nextStatus: SubmissionStatus) {
    setPendingStatus(nextStatus);
    setError(null);

    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
          feedback: feedbackInput,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update submission.");
      }

      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update submission.",
      );
    } finally {
      setPendingStatus(null);
    }
  }

  if (variant === "table") {
    if (!quickStatus) {
      return (
        <span className="text-xs font-medium text-slate-400">
          {status === "approved" ? "Approved" : "Rejected"}
        </span>
      );
    }

    const actionMeta = getSubmissionActionMeta(quickStatus);

    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void updateSubmission(quickStatus)}
          disabled={pendingStatus !== null}
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
            actionMeta.className,
          )}
        >
          {pendingStatus === quickStatus ? "Updating..." : actionMeta.label}
        </button>
        {error ? <p className="max-w-[12rem] text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={`submission-feedback-${submissionId}`}
          className="mb-2 block text-sm font-medium text-slate-600"
        >
          Review feedback
        </label>
        <textarea
          id={`submission-feedback-${submissionId}`}
          rows={5}
          value={feedbackInput}
          onChange={(event) => setFeedbackInput(event.target.value)}
          placeholder="Share changes, blockers, or approval notes for this delivery."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {(["revision_requested", "approved", "rejected"] as SubmissionStatus[]).map(
          (nextStatus) => {
            const actionMeta = getSubmissionActionMeta(nextStatus);

            return (
              <button
                key={nextStatus}
                type="button"
                onClick={() => void updateSubmission(nextStatus)}
                disabled={pendingStatus !== null || status === nextStatus || isFinal}
                className={cn(
                  "inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                  actionMeta.className,
                )}
              >
                {pendingStatus === nextStatus ? "Updating..." : actionMeta.label}
              </button>
            );
          },
        )}
      </div>

      {isFinal ? (
        <p className="text-sm text-slate-500">
          This delivery has been finalized. The detail page remains read-only for review actions.
        </p>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
