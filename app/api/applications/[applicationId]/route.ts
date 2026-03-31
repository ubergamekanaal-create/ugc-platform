import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ApplicationRouteProps = {
  params: {
    applicationId: string;
  };
};

type UpdateApplicationBody = {
  status?: "shortlisted" | "accepted" | "declined";
};

export async function PATCH(
  request: Request,
  { params }: ApplicationRouteProps,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | UpdateApplicationBody
    | null;
  const status = body?.status;

  if (
    status !== "shortlisted" &&
    status !== "accepted" &&
    status !== "declined"
  ) {
    return NextResponse.json(
      { error: "A valid application status is required." },
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

  const { data: application, error: applicationError } = await supabase
    .from("campaign_applications")
    .select("id, campaign_id, creator_id, status")
    .eq("id", params.applicationId)
    .maybeSingle();

  if (applicationError) {
    return NextResponse.json(
      { error: applicationError.message },
      { status: 400 },
    );
  }

  if (!application) {
    return NextResponse.json(
      { error: "Application not found." },
      { status: 404 },
    );
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, brand_id")
    .eq("id", application.campaign_id)
    .eq("brand_id", user.id)
    .maybeSingle();

  if (campaignError) {
    return NextResponse.json(
      { error: campaignError.message },
      { status: 400 },
    );
  }

  if (!campaign) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: updatedApplication, error: updateError } = await supabase
    .from("campaign_applications")
    .update({ status })
    .eq("id", application.id)
    .select("id, campaign_id, creator_id, pitch, rate, status, created_at")
    .single();

  if (updateError || !updatedApplication) {
    return NextResponse.json(
      { error: updateError?.message ?? "Unable to update application." },
      { status: 400 },
    );
  }

  return NextResponse.json({ application: updatedApplication });
}
