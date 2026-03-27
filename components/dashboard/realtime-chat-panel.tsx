"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatCandidate,
  ChatConversationSummary,
  ChatMessage,
  Role,
  UserProfile,
} from "@/lib/types";
import { cn, formatDate, getInitials } from "@/lib/utils";

type RealtimeChatPanelProps = {
  profile: UserProfile;
  role: Role;
  candidates: ChatCandidate[];
};

type ConversationsResponse = {
  conversations?: ChatConversationSummary[];
  conversation?: ChatConversationSummary | null;
  error?: string;
};

type MessagesResponse = {
  messages?: ChatMessage[];
  message?: ChatMessage;
  error?: string;
};

type MessageInsertPayload = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function sortConversations(conversations: ChatConversationSummary[]) {
  return [...conversations].sort((left, right) => {
    const leftTime = left.latest_message_at ?? left.created_at;
    const rightTime = right.latest_message_at ?? right.created_at;

    return new Date(rightTime).getTime() - new Date(leftTime).getTime();
  });
}

export function RealtimeChatPanel({
  profile,
  role,
  candidates,
}: RealtimeChatPanelProps) {
  const [conversations, setConversations] = useState<ChatConversationSummary[]>(
    [],
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeConversationId) ??
      null,
    [activeConversationId, conversations],
  );
  const conversationIdsKey = useMemo(
    () => conversations.map((conversation) => conversation.id).join(","),
    [conversations],
  );

  async function loadConversations(options?: { preferredId?: string | null }) {
    setIsLoadingConversations(true);

    try {
      const response = await fetch("/api/chat/conversations", {
        cache: "no-store",
      });
      const payload = (await response.json()) as ConversationsResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load conversations.");
      }

      const nextConversations = sortConversations(payload.conversations ?? []);
      setConversations(nextConversations);
      setActiveConversationId((current) => {
        if (options?.preferredId) {
          return options.preferredId;
        }

        if (current && nextConversations.some((item) => item.id === current)) {
          return current;
        }

        return nextConversations[0]?.id ?? null;
      });
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to load conversations.",
      );
    } finally {
      setIsLoadingConversations(false);
    }
  }

  async function loadMessages(conversationId: string) {
    setIsLoadingMessages(true);

    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages`,
        {
          cache: "no-store",
        },
      );
      const payload = (await response.json()) as MessagesResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load messages.");
      }

      setMessages(payload.messages ?? []);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to load messages.",
      );
    } finally {
      setIsLoadingMessages(false);
    }
  }

  async function ensureConversation(counterpartId: string) {
    setFeedback(null);
    setIsCreatingConversation(true);

    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ counterpartId }),
      });
      const payload = (await response.json()) as ConversationsResponse;

      if (!response.ok || !payload.conversation) {
        throw new Error(
          payload.error ?? "Unable to start a conversation with this contact.",
        );
      }

      setConversations(sortConversations(payload.conversations ?? []));
      setActiveConversationId(payload.conversation.id);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to start a conversation.",
      );
    } finally {
      setIsCreatingConversation(false);
    }
  }

  async function handleSendMessage() {
    if (!activeConversationId || !draft.trim()) {
      return;
    }

    setFeedback(null);
    setIsSending(true);

    try {
      const response = await fetch(
        `/api/chat/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body: draft }),
        },
      );
      const payload = (await response.json()) as MessagesResponse;

      if (!response.ok || !payload.message) {
        throw new Error(payload.error ?? "Unable to send message.");
      }

      const sentMessage = payload.message;

      setDraft("");
      setMessages((current) => {
        if (current.some((item) => item.id === sentMessage.id)) {
          return current;
        }

        return [...current, sentMessage];
      });
      setConversations((current) =>
        sortConversations(
          current.map((conversation) =>
            conversation.id === activeConversationId
              ? {
                  ...conversation,
                  latest_message_preview: sentMessage.body,
                  latest_message_at: sentMessage.created_at,
                }
              : conversation,
          ),
        ),
      );
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to send message.",
      );
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    void loadMessages(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-messages-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        async (payload) => {
          const nextMessage = payload.new as MessageInsertPayload;

          if (nextMessage.conversation_id === activeConversationId) {
            setMessages((current) => {
              if (current.some((item) => item.id === nextMessage.id)) {
                return current;
              }

              return [
                ...current,
                {
                  id: nextMessage.id,
                  conversation_id: nextMessage.conversation_id,
                  sender_id: nextMessage.sender_id,
                  sender_name:
                    nextMessage.sender_id === profile.id
                      ? profile.role === "brand"
                        ? profile.company_name ?? "Brand"
                        : profile.full_name ?? "Creator"
                      : activeConversation?.counterpart_name ?? "Member",
                  body: nextMessage.body,
                  created_at: nextMessage.created_at,
                },
              ];
            });
          }

          const response = await fetch("/api/chat/conversations", {
            cache: "no-store",
          });
          const data = (await response.json()) as ConversationsResponse;

          if (response.ok) {
            setConversations(sortConversations(data.conversations ?? []));
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    activeConversation?.counterpart_name,
    activeConversationId,
    profile.company_name,
    profile.full_name,
    profile.id,
    profile.role,
    conversationIdsKey,
  ]);

  const existingCounterpartIds = new Set(
    conversations.map((conversation) => conversation.counterpart_id),
  );
  const availableCandidates = candidates.filter(
    (candidate) => !existingCounterpartIds.has(candidate.id),
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4 px-2 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Inbox</h2>
            <p className="text-sm text-slate-500">
              {role === "brand" ? "Creator messages" : "Brand messages"}
            </p>
          </div>
          {isLoadingConversations ? (
            <span className="text-sm text-slate-400">Loading...</span>
          ) : null}
        </div>

        <div className="space-y-2">
          {conversations.length ? (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setActiveConversationId(conversation.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-[1.5rem] px-3 py-4 text-left transition",
                  conversation.id === activeConversationId
                    ? "bg-slate-100"
                    : "hover:bg-slate-50",
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                  {getInitials(conversation.counterpart_name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate font-semibold text-slate-950">
                      {conversation.counterpart_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {conversation.latest_message_at
                        ? formatDate(conversation.latest_message_at)
                        : formatDate(conversation.created_at)}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-sm text-slate-500">
                    {conversation.latest_message_preview ??
                      conversation.campaign_title ??
                      "Start the conversation"}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
              No active conversations yet.
            </div>
          )}
        </div>

        {availableCandidates.length ? (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="px-2 text-sm font-semibold text-slate-900">
              Start a conversation
            </p>
            <div className="mt-3 space-y-2">
              {availableCandidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => void ensureConversation(candidate.id)}
                  disabled={isCreatingConversation}
                  className="flex w-full items-center gap-3 rounded-[1.25rem] border border-slate-200 px-3 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold text-accent">
                    {getInitials(candidate.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-950">
                      {candidate.name}
                    </span>
                    <span className="block truncate text-sm text-slate-500">
                      {candidate.context_label ?? candidate.headline ?? "Eligible to chat"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="min-h-[620px] rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        {activeConversation ? (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                  {getInitials(activeConversation.counterpart_name)}
                </span>
                <div>
                  <p className="font-semibold text-slate-950">
                    {activeConversation.counterpart_name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {activeConversation.counterpart_headline ??
                      activeConversation.campaign_title ??
                      "Conversation"}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                Realtime
              </span>
            </div>

            <div className="space-y-5 py-8">
              {isLoadingMessages ? (
                <div className="text-sm text-slate-500">Loading messages...</div>
              ) : messages.length ? (
                messages.map((message) => {
                  const isOwn = message.sender_id === profile.id;

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "max-w-xl rounded-[1.5rem] px-5 py-4 text-sm leading-7",
                        isOwn
                          ? "ml-auto bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] text-white"
                          : "bg-slate-100 text-slate-700",
                      )}
                    >
                      <p className="text-xs font-medium opacity-80">
                        {message.sender_name}
                      </p>
                      <p className="mt-2">{message.body}</p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                  No messages yet. Send the first message to start the thread.
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  placeholder="Write a message"
                  className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
                <button
                  type="button"
                  disabled={isSending || !draft.trim()}
                  onClick={() => void handleSendMessage()}
                  className="h-12 rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 px-6 text-center">
            <p className="text-2xl font-semibold text-slate-950">
              Start a conversation
            </p>
            <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
              {candidates.length
                ? "Choose a creator or brand from the list to open a realtime thread."
                : "Chat becomes available once a brand and creator share campaign activity."}
            </p>
          </div>
        )}

        {feedback ? <p className="mt-4 text-sm text-slate-500">{feedback}</p> : null}
      </section>
    </div>
  );
}
