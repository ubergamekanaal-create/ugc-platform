import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BrandWorkspace } from "@/components/dashboard/brand-workspace";
import {
  BrandApplicationActionButtons,
  BrandSubmissionActionButtons,
} from "@/components/dashboard/brand-review-actions";
import { SubmissionAssetsGallery } from "@/components/dashboard/submission-assets-gallery";
import { WorkspacePanel } from "@/components/dashboard/workspace-shell";
import { getDashboardContext } from "@/lib/data/platform";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type QueueSubmissionDetailPageProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export default async function QueueSubmissionDetailPage({
  params,
}: QueueSubmissionDetailPageProps) {
  const [{ applicationId }, context] = await Promise.all([
    params,
    getDashboardContext("submissions"),
  ]);

  if (!context) {
    redirect("/login");
  }

  if (context.role !== "brand") {
    redirect("/dashboard");
  }

  const application =
    context.data.applications.find((item) => item.id === applicationId) ?? null;

  if (!application) {
    notFound();
  }

  const campaign =
    context.data.campaigns.find((item) => item.id === application.campaign_id) ?? null;
  const creator =
    context.data.creators.find((item) => item.id === application.creator_id) ?? null;
  const linkedSubmission =
    context.data.submissions.find(
      (item) =>
        item.campaign_id === application.campaign_id &&
        item.creator_id === application.creator_id,
    ) ?? null;
  const linkedPayout =
    context.data.payouts.find(
      (item) => linkedSubmission && item.submission_id === linkedSubmission.id,
    ) ?? null;

  return (
    <BrandWorkspace
      profile={context.profile}
      data={context.data}
      section="submissions"
      renderMode="content"
      detailView={{
        title: `${application.creator_name} review`,
        description:
          "Use the full review view to validate creator fit, move the application forward, and handle any linked delivery without bouncing between cards.",
        metaItems: [
          {
            label: "Application status",
            value: application.status.replaceAll("_", " "),
          },
          {
            label: "Quoted rate",
            value: formatCurrency(application.rate),
          },
          {
            label: "Submitted",
            value: formatDate(application.created_at),
          },
        ],
        banner: (
          <WorkspacePanel className="bg-[linear-gradient(135deg,_rgba(231,242,255,0.94),_rgba(255,255,255,0.98),_rgba(239,246,255,0.95))]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                  Queue detail
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Keep application review and delivery review in one decision flow.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                  This view is designed for deliberate review. Use the table for quick triage,
                  then move here when you need creator context, campaign detail, and full review
                  controls.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/submissions"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-accent/15 bg-[rgba(7,107,210,0.06)] px-5 text-sm font-semibold text-accent transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.1)]"
                >
                  Back to tables
                </Link>
                {linkedSubmission ? (
                  <Link
                    href={`/dashboard/submissions/deliveries/${linkedSubmission.id}`}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[color:#076BD2] px-5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(7,107,210,0.2)] transition hover:bg-[#0559AE]"
                  >
                    Open delivery detail
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
                  Application pitch
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {application.creator_name}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {application.creator_headline ?? "Creator profile in review"}
                </p>
                <p className="mt-6 text-base leading-8 text-slate-700">
                  {application.pitch}
                </p>
              </WorkspacePanel>

              <WorkspacePanel>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Application actions
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  Move the creator forward
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Shortlist the application, accept it into the brief, or decline it from a
                  single review surface.
                </p>
                <div className="mt-6">
                  <BrandApplicationActionButtons
                    applicationId={application.id}
                    status={application.status}
                    variant="detail"
                  />
                </div>
              </WorkspacePanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <WorkspacePanel>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Creator snapshot
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                      Brand-side fit summary
                    </h2>
                  </div>
                  {creator?.location ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      {creator.location}
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Base rate
                    </p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">
                      {creator?.base_rate
                        ? formatCurrency(creator.base_rate)
                        : formatCurrency(application.rate)}
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
                  <div className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Avg. views
                    </p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">
                      {creator?.average_views ? String(creator.average_views) : "Not set"}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      Previous accepts
                    </p>
                    <p className="mt-3 text-xl font-semibold text-slate-950">
                      {creator?.accepted ?? 0}
                    </p>
                  </div>
                </div>

                {creator?.niches.length ? (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-slate-600">Niches</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {creator.niches.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {creator?.platform_specialties.length ? (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-slate-600">Platforms</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {creator.platform_specialties.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-[rgba(7,107,210,0.08)] px-3 py-1 text-xs font-medium text-accent"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </WorkspacePanel>

              <WorkspacePanel>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Campaign context
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {application.campaign_title}
                </h2>
                <div className="mt-6 space-y-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <span>Status</span>
                    <span className="font-semibold text-slate-950">
                      {campaign?.status.replaceAll("_", " ") ?? "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <span>Budget</span>
                    <span className="font-semibold text-slate-950">
                      {campaign ? formatCompactCurrency(campaign.budget) : "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <span>Deliveries</span>
                    <span className="font-semibold text-slate-950">
                      {campaign?.deliverables || "Not specified"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <span>Deadline</span>
                    <span className="font-semibold text-slate-950">
                      {campaign?.deadline ? formatDate(campaign.deadline) : "Flexible"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <span>Linked delivery</span>
                    <span className="font-semibold text-slate-950">
                      {linkedSubmission ? linkedSubmission.status.replaceAll("_", " ") : "Not submitted"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <span>Linked payout</span>
                    <span className="font-semibold text-slate-950">
                      {linkedPayout ? formatCurrency(linkedPayout.creator_amount) : "Not queued"}
                    </span>
                  </div>
                </div>
              </WorkspacePanel>
            </div>

            {linkedSubmission ? (
              <WorkspacePanel>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Linked delivery
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                      Submission details available
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                      Review the linked delivery directly here or open the dedicated delivery
                      detail page for final approval actions.
                    </p>
                  </div>
                  <BrandSubmissionActionButtons
                    submissionId={linkedSubmission.id}
                    status={linkedSubmission.status}
                    feedback={linkedSubmission.feedback}
                    variant="table"
                  />
                </div>

                <div className="mt-6">
                  <SubmissionAssetsGallery
                    assets={linkedSubmission.assets}
                    emptyLabel="The linked delivery has no uploaded files yet."
                  />
                </div>
              </WorkspacePanel>
            ) : null}
          </div>
        ),
      }}
    />
  );
}
