import { NextResponse } from "next/server";
import {
  getConversationById,
  getConversationMessages,
  requireChatActor,
} from "@/lib/chat/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ConversationMessagesRouteProps = {
  params: {
    conversationId: string;
  };
};

export async function GET(
  _request: Request,
  { params }: ConversationMessagesRouteProps,
) {
  const supabase = await createClient();
  const actor = await requireChatActor(supabase);

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const conversation = await getConversationById(
    supabase,
    actor,
    params.conversationId,
  );

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }

  const messages = await getConversationMessages(supabase, conversation.id);

  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: ConversationMessagesRouteProps,
) {
  const supabase = await createClient();
  const actor = await requireChatActor(supabase);

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const conversation = await getConversationById(
    supabase,
    actor,
    params.conversationId,
  );

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { body?: string }
    | null;
  const messageBody = body?.body?.trim() ?? "";

  if (!messageBody) {
    return NextResponse.json(
      { error: "Message body is required." },
      { status: 400 },
    );
  }

  const { data: message, error } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: conversation.id,
      sender_id: actor.id,
      body: messageBody,
    })
    .select("id, conversation_id, sender_id, body, created_at")
    .single();

  if (error || !message) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to send message." },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from("chat_conversations")
    .update({ last_message_at: message.created_at })
    .eq("id", conversation.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 400 },
    );
  }

  return NextResponse.json({
    message: {
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      sender_name: actor.display_name,
      body: message.body,
      created_at: message.created_at,
    },
  });
}
