import { NextResponse } from "next/server";
import { calculatePayoutBreakdown } from "@/lib/payments/platform-commission";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SubmissionRouteProps = {
  params: {
    submissionId: string;
  };
};

type UpdateSubmissionBody = {
  status?: "revision_requested" | "approved" | "rejected";
  feedback?: string;
};

export async function PATCH(
  request: Request,
  { params }: SubmissionRouteProps,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as UpdateSubmissionBody | null;
  const status = body?.status;
  const feedback = body?.feedback?.trim() ?? "";

  if (
    status !== "revision_requested" &&
    status !== "approved" &&
    status !== "rejected"
  ) {
    return NextResponse.json(
      { error: "A valid review status is required." },
      { status: 400 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "brand") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: submission, error: lookupError } = await supabase
    .from("campaign_submissions")
    .select("id, campaign_id, brand_id, creator_id, application_id, revision_number, status")
    .eq("id", params.submissionId)
    .eq("brand_id", user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      { error: lookupError.message },
      { status: 400 },
    );
  }

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found." },
      { status: 404 },
    );
  }

  if (submission.status === "approved" || submission.status === "rejected") {
    return NextResponse.json(
      { error: "This submission has already been finalized." },
      { status: 400 },
    );
  }

  const { data: updatedSubmission, error: updateError } = await supabase
    .from("campaign_submissions")
    .update({
      status,
      feedback: feedback || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submission.id)
    .select(
      "id, campaign_id, brand_id, creator_id, application_id, revision_number, content_links, notes, feedback, status, created_at, updated_at, submitted_at, reviewed_at",
    )
    .single();

  if (updateError || !updatedSubmission) {
    return NextResponse.json(
      { error: updateError?.message ?? "Unable to update submission." },
      { status: 400 },
    );
  }

  if (status === "approved") {
    const applicationQuery = submission.application_id
      ? supabase
          .from("campaign_applications")
          .select("id, rate")
          .eq("id", submission.application_id)
          .maybeSingle()
      : supabase
          .from("campaign_applications")
          .select("id, rate")
          .eq("campaign_id", submission.campaign_id)
          .eq("creator_id", submission.creator_id)
          .maybeSingle();

    const { data: application, error: applicationError } = await applicationQuery;

    if (applicationError) {
      return NextResponse.json(
        { error: applicationError.message },
        { status: 400 },
      );
    }

    const payoutBreakdown = calculatePayoutBreakdown(Number(application?.rate ?? 0));

    const { error: payoutError } = await supabase
      .from("campaign_payouts")
      .upsert(
        {
          campaign_id: submission.campaign_id,
          submission_id: submission.id,
          brand_id: submission.brand_id,
          creator_id: submission.creator_id,
          application_id: application?.id ?? submission.application_id ?? null,
          amount: payoutBreakdown.grossAmount,
          platform_fee_percent: payoutBreakdown.platformFeePercent,
          platform_fee_amount: payoutBreakdown.platformFeeAmount,
          creator_amount: payoutBreakdown.creatorAmount,
          currency: "usd",
          status: "payout_ready",
          source_funding_id: null,
          stripe_transfer_id: null,
          stripe_account_id: null,
          stripe_source_charge_id: null,
          stripe_transfer_group: null,
          reversed_amount: 0,
          failure_reason: null,
          paid_at: null,
          reversed_at: null,
        },
        {
          onConflict: "submission_id",
        },
      );

    if (payoutError) {
      return NextResponse.json(
        { error: payoutError.message },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ submission: updatedSubmission });
}
