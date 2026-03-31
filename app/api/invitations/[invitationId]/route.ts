import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type InvitationRouteProps = {
  params: {
    invitationId: string;
  };
};

type InvitationAction = "accept" | "decline";

function getAcceptedPitch(message: string | null) {
  return (
    message?.trim() || "Accepted a brand invitation through the CIRCL creator dashboard."
  );
}

async function revertInvitationToPending(invitationId: string) {
  const admin = createAdminClient();

  if (!admin) {
    return;
  }

  await admin
    .from("campaign_invitations")
    .update({ status: "pending" })
    .eq("id", invitationId);
}

export async function PATCH(
  request: Request,
  { params }: InvitationRouteProps,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { action?: InvitationAction }
    | null;
  const action = body?.action;

  if (action !== "accept" && action !== "decline") {
    return NextResponse.json(
      { error: "A valid invitation action is required." },
      { status: 400 },
    );
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("campaign_invitations")
    .select(
      "id, campaign_id, brand_id, creator_id, message, offered_rate, status, created_at, updated_at",
    )
    .eq("id", params.invitationId)
    .eq("creator_id", user.id)
    .maybeSingle();

  if (invitationError) {
    return NextResponse.json(
      { error: invitationError.message },
      { status: 400 },
    );
  }

  if (!invitation) {
    return NextResponse.json(
      { error: "Invitation not found." },
      { status: 404 },
    );
  }

  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: "This invitation has already been processed." },
      { status: 400 },
    );
  }

  const nextStatus = action === "accept" ? "accepted" : "declined";
  const { error: updateError } = await supabase
    .from("campaign_invitations")
    .update({ status: nextStatus })
    .eq("id", invitation.id)
    .eq("creator_id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 400 },
    );
  }

  if (action === "decline") {
    return NextResponse.json({ status: nextStatus });
  }

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const { data: existingApplication, error: applicationLookupError } = await admin
    .from("campaign_applications")
    .select("id, pitch, rate, status")
    .eq("campaign_id", invitation.campaign_id)
    .eq("creator_id", invitation.creator_id)
    .maybeSingle();

  if (applicationLookupError) {
    await revertInvitationToPending(invitation.id);
    return NextResponse.json(
      { error: applicationLookupError.message },
      { status: 400 },
    );
  }

  if (existingApplication) {
    const { error: applicationUpdateError } = await admin
      .from("campaign_applications")
      .update({
        pitch: existingApplication.pitch || getAcceptedPitch(invitation.message),
        rate:
          Number(existingApplication.rate) > 0
            ? existingApplication.rate
            : Number(invitation.offered_rate || 0),
        status: "accepted",
      })
      .eq("id", existingApplication.id);

    if (applicationUpdateError) {
      await revertInvitationToPending(invitation.id);
      return NextResponse.json(
        { error: applicationUpdateError.message },
        { status: 400 },
      );
    }
  } else {
    const { error: applicationInsertError } = await admin
      .from("campaign_applications")
      .insert({
        campaign_id: invitation.campaign_id,
        creator_id: invitation.creator_id,
        pitch: getAcceptedPitch(invitation.message),
        rate: Number(invitation.offered_rate || 0),
        status: "accepted",
      });

    if (applicationInsertError) {
      await revertInvitationToPending(invitation.id);
      return NextResponse.json(
        { error: applicationInsertError.message },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ status: nextStatus });
}
