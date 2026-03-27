import { NextResponse } from "next/server";
import {
  getConversationSummaries,
  requireChatActor,
  resolveConversationSeed,
} from "@/lib/chat/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const actor = await requireChatActor(supabase);

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const conversations = await getConversationSummaries(supabase, actor);

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const actor = await requireChatActor(supabase);

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { counterpartId?: string }
    | null;
  const counterpartId = body?.counterpartId?.trim() ?? "";

  if (!counterpartId) {
    return NextResponse.json(
      { error: "Counterpart is required." },
      { status: 400 },
    );
  }

  const seed = await resolveConversationSeed({
    supabase,
    actor,
    counterpartId,
  });

  if (!seed) {
    return NextResponse.json(
      {
        error:
          "Conversation can only be started after a brand and creator share campaign activity.",
      },
      { status: 403 },
    );
  }

  const { data: existingConversation } = await supabase
    .from("chat_conversations")
    .select("id")
    .eq("brand_id", seed.brandId)
    .eq("creator_id", seed.creatorId)
    .maybeSingle();

  let conversationId = existingConversation?.id ?? null;

  if (!conversationId) {
    const { data: createdConversation, error } = await supabase
      .from("chat_conversations")
      .insert({
        brand_id: seed.brandId,
        creator_id: seed.creatorId,
        campaign_id: seed.campaignId,
        created_by: actor.id,
        last_message_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !createdConversation) {
      return NextResponse.json(
        { error: error?.message ?? "Unable to create conversation." },
        { status: 400 },
      );
    }

    conversationId = createdConversation.id;
  }

  const conversations = await getConversationSummaries(supabase, actor);
  const conversation =
    conversations.find((item) => item.id === conversationId) ?? null;

  return NextResponse.json({
    conversation,
    conversations,
  });
}
