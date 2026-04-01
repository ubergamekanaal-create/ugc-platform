import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrandWorkspace } from "@/components/dashboard/brand-workspace";
import { BrandSubmissionActionButtons } from "@/components/dashboard/brand-review-actions";
import { SubmissionAssetsGallery } from "@/components/dashboard/submission-assets-gallery";
import { WorkspacePanel } from "@/components/dashboard/workspace-shell";
import { getDashboardContext } from "@/lib/data/platform";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type DeliverySubmissionDetailPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export default async function DeliverySubmissionDetailPage({
  params,
}: DeliverySubmissionDetailPageProps) {
  const [{ submissionId }, context] = await Promise.all([
    params,
    getDashboardContext(),
  ]);

  if (!context) {
    redirect("/login");
  }

  if (context.role !== "brand") {
    redirect("/dashboard");
  }

  const submission =
    context.data.submissions.find((item) => item.id === submissionId) ?? null;

  if (!submission) {
    notFound();
  }

  const application =
    context.data.applications.find(
      (item) =>
        item.id === submission.application_id ||
        (item.campaign_id === submission.campaign_id &&
          item.creator_id === submission.creator_id),
    ) ?? null;
  const campaign =
    context.data.campaigns.find((item) => item.id === submission.campaign_id) ?? null;
  const creator =
    context.data.creators.find((item) => item.id === submission.creator_id) ?? null;
  const payout =
    context.data.payouts.find((item) => item.submission_id === submission.id) ?? null;

  return (
    <BrandWorkspace
      profile={context.profile}
      data={context.data}
      section="submissions"
      renderMode="content"
      detailView={{
        title: `${submission.creator_name} delivery review`,
        description:
          "Review the submission in full context, confirm revision quality, and decide whether the work moves into payout or back into revision.",
        metaItems: [
          {
            label: "Delivery status",
            value: submission.status.replaceAll("_", " "),
          },
          {
            label: "Revision",
            value: String(submission.revision_number),
          },
          {
            label: "Rate",
            value: formatCurrency(submission.rate),
          },
        ],
        banner: (
          <WorkspacePanel className="bg-[linear-gradient(135deg,_rgba(231,242,255,0.95),_rgba(255,255,255,0.97),_rgba(239,246,255,0.94))]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                  Delivery detail
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Handle the delivery where the actual review decision happens.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                  Use this view when the table row is no longer enough. Everything needed to
                  review the submission, its links, files, campaign context, and payout outcome
                  is kept together here.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/submissions"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-accent/15 bg-[rgba(7,107,210,0.06)] px-5 text-sm font-semibold text-accent transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.1)]"
                >
                  Back to tables
                </Link>
                {application ? (
                  <Link
                    href={`/dashboard/submissions/queue/${application.id}`}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[color:#076BD2] px-5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.2)] transition hover:bg-[#0559AE]"
                  >
                    Open queue detail
                  </Link>
                ) : null}
              </div>
            </div>
          </WorkspacePanel>
        ),
        content: (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <WorkspacePanel>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Delivery contents
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Submitted assets and links
                </h2>

                {submission.notes ? (
                  <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                    {submission.notes}
                  </div>
                ) : null}

                {submission.content_links.length ? (
                  <div className="mt-6 space-y-3">
                    {submission.content_links.map((link) => (
                      <a
                        key={link}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm font-medium text-accent transition hover:text-[#0559AE]"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                ) : null}

                <div className="mt-6">
                  <SubmissionAssetsGallery
                    assets={submission.assets}
                    emptyLabel="No uploaded assets were included with this submission."
                  />
                </div>

                {submission.feedback ? (
                  <div className="mt-6 rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(254,249,195,0.6),_rgba(255,255,255,0.92))] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Current review note
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {submission.feedback}
                    </p>
                  </div>
                ) : null}
              </WorkspacePanel>

              <WorkspacePanel>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Delivery actions
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Finalize review
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Request another revision, approve the delivery into payout, or reject the work
                  from the detail page.
                </p>
                <div className="mt-6">
                  <BrandSubmissionActionButtons
                    submissionId={submission.id}
                    status={submission.status}
                    feedback={submission.feedback}
                    variant="detail"
                  />
                </div>

                <div className="mt-6 space-y-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <span>Submitted</span>
                    <span className="font-semibold text-slate-950">
                      {submission.submitted_at
                        ? formatDate(submission.submitted_at)
                        : formatDate(submission.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <span>Reviewed</span>
                    <span className="font-semibold text-slate-950">
                      {submission.reviewed_at
                        ? formatDate(submission.reviewed_at)
                        : "Awaiting review"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <span>Assets</span>
                    <span className="font-semibold text-slate-950">
                      {submission.assets.length} files
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <span>Links</span>
                    <span className="font-semibold text-slate-950">
                      {submission.content_links.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <span>Payout</span>
                    <span className="font-semibold text-slate-950">
                      {payout ? formatCurrency(payout.creator_amount) : "Not queued"}
                    </span>
                  </div>
                </div>
              </WorkspacePanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <WorkspacePanel>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Campaign context
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {submission.campaign_title}
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Budget
                    </p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">
                      {campaign ? formatCompactCurrency(campaign.budget) : "Unknown"}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Campaign status
                    </p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">
                      {campaign?.status.replaceAll("_", " ") ?? "Unknown"}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Deliverables
                    </p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">
                      {campaign?.deliverables || "Not specified"}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Deadline
                    </p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">
                      {campaign?.deadline ? formatDate(campaign.deadline) : "Flexible"}
                    </p>
                  </div>
                </div>
              </WorkspacePanel>

              <WorkspacePanel>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Creator context
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {submission.creator_name}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {submission.creator_headline ?? "Creator profile in review"}
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Base rate
                    </p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">
                      {creator?.base_rate ? formatCurrency(creator.base_rate) : formatCurrency(submission.rate)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Engagement
                    </p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">
                      {creator?.engagement_rate ? `${creator.engagement_rate}%` : "Not set"}
                    </p>
                  </div>
                </div>

                {application ? (
                  <div className="mt-6 rounded-[1.5rem] bg-[rgba(7,107,210,0.05)] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Linked application
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {application.pitch}
                    </p>
                  </div>
                ) : null}
              </WorkspacePanel>
            </div>
          </div>
        ),
      }}
    />
  );
}
