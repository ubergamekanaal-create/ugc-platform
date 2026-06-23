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

const lastReadStorageKey = "chat:last-read:v1";

function formatMessageTimestamp(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getMessageDateKey(value: string) {
  const date = new Date(value);

  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getOrdinalSuffix(day: number) {
  if (day >= 11 && day <= 13) {
    return "th";
  }

  if (day % 10 === 1) {
    return "st";
  }

  if (day % 10 === 2) {
    return "nd";
  }

  if (day % 10 === 3) {
    return "rd";
  }

  return "th";
}

function formatMessageDateLabel(value: string) {
  const date = new Date(value);
  const today = new Date();

  if (getMessageDateKey(value) === getMessageDateKey(today.toISOString())) {
    return "Today";
  }

  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    date,
  );
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    date,
  );
  const day = date.getDate();

  return `${weekday}, ${month} ${day}${getOrdinalSuffix(day)}`;
}

function formatRelativeTimestamp(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return formatDate(value);
}

function formatRoasValue(value: number | null) {
  if (value === null) {
    return "--";
  }

  return `${value.toFixed(1)}x`;
}

function formatGmvValue(value: number | null) {
  if (value === null) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<ChatConversationSummary[]>(
    [],
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [chatFilter, setChatFilter] = useState<"unread" | "read">("unread");
  const [lastReadById, setLastReadById] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const composerInputRef = useRef<HTMLInputElement | null>(null);
  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? null,
    [activeConversationId, conversations],
  );
  const conversationIdsKey = useMemo(
    () => conversations.map((conversation) => conversation.id).join(","),
    [conversations],
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(lastReadStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        if (parsed && typeof parsed === "object") {
          setLastReadById(parsed);
        }
      }
    } catch {
      // Ignore malformed localStorage values.
    }
  }, []);

  const markConversationRead = (
    conversationId: string,
    timestamp: string | null | undefined,
  ) => {
    if (!timestamp) {
      return;
    }

    setLastReadById((current) => {
      const existing = current[conversationId];
      const existingTime = existing ? new Date(existing).getTime() : 0;
      const nextTime = new Date(timestamp).getTime();

      if (existingTime >= nextTime) {
        return current;
      }

      const next = { ...current, [conversationId]: timestamp };

      try {
        localStorage.setItem(lastReadStorageKey, JSON.stringify(next));
      } catch {
        // Ignore storage failures.
      }

      return next;
    });
  };

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

      const nextMessages = payload.messages ?? [];
      setMessages(nextMessages);
      const latestTimestamp =
        nextMessages[nextMessages.length - 1]?.created_at ??
        conversations.find((conversation) => conversation.id === conversationId)
          ?.latest_message_at ??
        conversations.find((conversation) => conversation.id === conversationId)
          ?.created_at ??
        null;
      markConversationRead(conversationId, latestTimestamp);
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
      markConversationRead(activeConversationId, sentMessage.created_at);
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
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
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
                        ? (profile.company_name ?? "Brand")
                        : (profile.full_name ?? "Creator")
                      : (activeConversation?.counterpart_name ?? "Member"),
                  body: nextMessage.body,
                  created_at: nextMessage.created_at,
                },
              ];
            });
            markConversationRead(activeConversationId, nextMessage.created_at);
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

  useEffect(() => {
    setIsProfileDrawerOpen(false);
  }, [activeConversationId]);

  const existingCounterpartIds = new Set(
    conversations.map((conversation) => conversation.counterpart_id),
  );
  const availableCandidates = candidates.filter(
    (candidate) => !existingCounterpartIds.has(candidate.id),
  );
  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const isConversationUnread = (conversation: ChatConversationSummary) => {
      const latest = conversation.latest_message_at ?? conversation.created_at;
      const lastRead = lastReadById[conversation.id] ?? null;

      if (!latest) {
        return false;
      }

      if (!lastRead) {
        return true;
      }

      return new Date(latest).getTime() > new Date(lastRead).getTime();
    };

    const scopedConversations = conversations.filter((conversation) =>
      chatFilter === "read"
        ? !isConversationUnread(conversation)
        : isConversationUnread(conversation),
    );

    if (!query) {
      return scopedConversations;
    }

    return scopedConversations.filter((conversation) =>
      [
        conversation.counterpart_name,
        conversation.counterpart_headline ?? "",
        conversation.campaign_title ?? "",
        conversation.latest_message_preview ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [chatFilter, conversations, lastReadById, searchQuery]);
  const filteredCandidates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return availableCandidates;
    }

    return availableCandidates.filter((candidate) =>
      [candidate.name, candidate.headline ?? "", candidate.context_label ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [availableCandidates, searchQuery]);
  const activeCounterpartCandidate = useMemo(
    () =>
      candidates.find(
        (candidate) => candidate.id === activeConversation?.counterpart_id,
      ) ?? null,
    [activeConversation, candidates],
  );
  const profileDrawerDetails = useMemo(() => {
    if (!activeConversation) {
      return null;
    }

    const counterpartProfile = activeConversation.counterpart_profile;
    const latestMessage = messages[messages.length - 1] ?? null;
    const headline =
      activeCounterpartCandidate?.headline ??
      activeConversation.counterpart_headline ??
      null;
    const context =
      activeCounterpartCandidate?.context_label ??
      activeConversation.campaign_title ??
      "General collaboration thread";
    const activeBriefs = counterpartProfile?.active_briefs.length
      ? counterpartProfile.active_briefs
      : activeConversation.campaign_title
        ? [
          {
            title: activeConversation.campaign_title,
            subtitle:
              activeCounterpartCandidate?.context_label ?? headline ?? null,
          },
        ]
        : [];

    return {
      initials: getInitials(activeConversation.counterpart_name),
      name: activeConversation.counterpart_name,
      handle: `@${activeConversation.counterpart_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 18) || "member"
        }`,
      label: role === "brand" ? "Creator profile" : "Brand profile",
      headline,
      posts: counterpartProfile?.posts ?? null,
      roas: counterpartProfile?.roas ?? null,
      gmv: counterpartProfile?.gmv ?? null,
      rating: counterpartProfile?.rating ?? null,
      activeBriefs,
      context,
      campaignTitle: activeConversation.campaign_title,
      lastActivity:
        activeConversation.latest_message_at ?? activeConversation.created_at,
      conversationStartedAt: activeConversation.created_at,
      latestMessagePreview:
        latestMessage?.body ??
        activeConversation.latest_message_preview ??
        "No message preview available yet.",
      messageCount: messages.length,
      active: activeConversation.active,
    };
  }, [activeConversation, activeCounterpartCandidate, messages, role]);

  return (
    <div className="relative h-full">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className=" rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-4 px-2 pb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Messages</h2>
              <p className="text-sm text-slate-500">
                {role === "brand"
                  ? "Creator conversations"
                  : "Brand conversations"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setChatFilter("unread")}
                  className={cn(
                    "rounded-full px-2 py-0.5 font-semibold transition",
                    chatFilter === "unread"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-900",
                  )}
                >
                  Unread
                </button>
                <button
                  type="button"
                  onClick={() => setChatFilter("read")}
                  className={cn(
                    "rounded-full px-2 py-0.5 font-semibold transition",
                    chatFilter === "read"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-900",
                  )}
                >
                  Read
                </button>
              </div>
              {isLoadingConversations ? (
                <span className="text-sm text-slate-400">Loading...</span>
              ) : null}
            </div>
          </div>

          <div className="px-2 pb-4">
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={
                  role === "brand" ? "Search creators" : "Search brands"
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredConversations.length ? (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={cn(
                    "relative flex w-full items-start gap-3 rounded-[1.5rem] border px-3 py-4 text-left transition",
                    conversation.id === activeConversationId
                      ? "border-accent/20 bg-[rgba(7,107,210,0.08)] shadow-[inset_3px_0_0_#076BD2]"
                      : "border-transparent hover:bg-slate-50",
                  )}
                >
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] text-sm font-semibold text-white">
                    {getInitials(conversation.counterpart_name)}
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white",
                        conversation.active ? "bg-emerald-500" : "bg-slate-400",
                      )}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold text-slate-950">
                        {conversation.counterpart_name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatRelativeTimestamp(
                          conversation.latest_message_at ??
                          conversation.created_at,
                        )}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-sm text-slate-700">
                      {conversation.latest_message_preview ??
                        conversation.campaign_title ??
                        "Start the conversation"}
                    </span>
                    {conversation.campaign_title ? (
                      <span className="mt-1 block truncate text-xs text-slate-400">
                        {conversation.campaign_title}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                No active conversations yet.
              </div>
            )}
          </div>

          {filteredCandidates.length ? (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <p className="px-2 text-sm font-semibold text-slate-900">
                Start a conversation
              </p>
              <div className="mt-3 space-y-2">
                {filteredCandidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => void ensureConversation(candidate.id)}
                    disabled={isCreatingConversation}
                    className="flex w-full items-center gap-3 rounded-[1.25rem] border border-slate-200 px-3 py-3 text-left transition hover:border-accent/20 hover:bg-[rgba(7,107,210,0.04)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold text-accent">
                      {getInitials(candidate.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-950">
                        {candidate.name}
                      </span>
                      <span className="block truncate text-sm text-slate-500">
                        {candidate.context_label ??
                          candidate.headline ??
                          "Eligible to chat"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="relative min-h-[calc(100vh-100px)] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex h-full max-h-[calc(100vh-100px)] flex-col p-6">
            {activeConversation ? (
              <>
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] text-sm font-semibold text-white">
                      {getInitials(activeConversation.counterpart_name)}
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white",
                          activeConversation.active
                            ? "bg-emerald-500"
                            : "bg-slate-300",
                        )}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {activeConversation.counterpart_name}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {activeConversation.counterpart_headline ??
                          activeConversation.campaign_title ??
                          "Conversation"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden rounded-full bg-[rgba(7,107,210,0.08)] px-3 py-1 text-sm font-medium text-accent sm:inline-flex">
                      Realtime
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsProfileDrawerOpen(true)}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-accent/20 hover:bg-[rgba(7,107,210,0.04)] hover:text-accent"
                    >
                      View profile
                    </button>
                  </div>
                </div>

                <div
                  ref={messagesContainerRef}
                  className="flex-1 space-y-5 overflow-y-auto py-3 pr-2"
                >
                  {isLoadingMessages ? (
                    <div className="text-sm text-slate-500">
                      Loading messages...
                    </div>
                  ) : messages.length ? (
                    messages.map((message, index) => {
                      const isOwn = message.sender_id === profile.id;
                      const showDateDivider =
                        index === 0 ||
                        getMessageDateKey(messages[index - 1].created_at) !==
                        getMessageDateKey(message.created_at);

                      return (
                        <div key={message.id} className="space-y-5">
                          {showDateDivider ? (
                            <div className="relative flex items-center justify-center py-1">
                              {/* <span className="absolute inset-x-0 top-1/2 h-px bg-slate-200" /> */}
                              <span className="relative inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                                {formatMessageDateLabel(message.created_at)}
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  className="h-3 w-3"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="m7 10 5 5 5-5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            </div>
                          ) : null}
                          <div
                            className={cn(
                              "max-w-sm rounded-[1.5rem] px-4 py-3 text-sm leading-7 shadow-[0_12px_30px_rgba(15,23,42,0.04)]",
                              isOwn
                                ? "ml-auto bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] text-white"
                                : "border border-slate-200 bg-white text-slate-700",
                            )}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-xs font-medium opacity-80">
                                {message.sender_name}
                              </p>
                              <p className="text-xs opacity-70">
                                {formatMessageTimestamp(message.created_at)}
                              </p>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap">
                              {message.body}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                      No messages yet. Send the first message to start the
                      thread.
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      ref={composerInputRef}
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
                      className="h-12 min-h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-accent/40 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
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

            {feedback ? (
              <p className="mt-4 text-sm text-slate-500">{feedback}</p>
            ) : null}
          </div>
        </section>
      </div>

      {isProfileDrawerOpen && activeConversation ? (
        <button
          type="button"
          aria-label="Close profile drawer"
          onClick={() => setIsProfileDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/24"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 h-full w-full mt-[60px] max-w-[400px] overflow-hidden border-l border-slate-200 bg-white shadow-[-24px_0_60px_rgba(15,23,42,0.18)] transition-transform duration-300",
          isProfileDrawerOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
            <div>
              <p className="text-sm font-medium text-accent">
                {profileDrawerDetails?.label ?? "Profile"}
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                Contact details
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileDrawerOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              aria-label="Close profile drawer"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6 18 18" />
                <path d="M18 6 6 18" />
              </svg>
            </button>
          </div>

          {profileDrawerDetails ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-20">
              <div className="flex flex-col gap-6 pb-6">
                <div className="flex flex-col items-center rounded-[1.75rem] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(7,107,210,0.12),_transparent_58%),linear-gradient(180deg,_#f8fbff,_#ffffff)] px-5 py-8 text-center">
                  <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] text-2xl font-semibold text-white shadow-[0_18px_40px_rgba(7,107,210,0.26)]">
                    {profileDrawerDetails.initials}
                  </span>
                  <p className="mt-5 text-xl font-semibold text-slate-950">
                    {profileDrawerDetails.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {profileDrawerDetails.handle}
                  </p>
                  {profileDrawerDetails.headline ? (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {profileDrawerDetails.headline}
                    </p>
                  ) : null}
                </div>

                {role === "brand" ? (
                  <>
                    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
                      <div className="grid grid-cols-2">
                        <div className="border-b border-r border-slate-200 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Posts
                          </p>
                          <p className="mt-2 text-[1.75rem] font-semibold leading-none text-slate-950">
                            {profileDrawerDetails.posts ?? "--"}
                          </p>
                        </div>
                        <div className="border-b border-slate-200 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            ROAS
                          </p>
                          <p className="mt-2 text-[1.75rem] font-semibold leading-none text-slate-950">
                            {formatRoasValue(profileDrawerDetails.roas)}
                          </p>
                        </div>
                        <div className="border-r border-slate-200 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            GMV
                          </p>
                          <p className="mt-2 text-[1.75rem] font-semibold leading-none text-slate-950">
                            {formatGmvValue(profileDrawerDetails.gmv)}
                          </p>
                        </div>
                        <div className="p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Rating
                          </p>
                          <p className="mt-2 text-[1.75rem] font-semibold leading-none text-slate-950">
                            {profileDrawerDetails.rating === null
                              ? "--"
                              : profileDrawerDetails.rating.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Active briefs
                      </p>
                      <div className="mt-4 space-y-4">
                        {profileDrawerDetails.activeBriefs.length
                          ? profileDrawerDetails.activeBriefs.map(
                            (brief, index) => (
                              <div
                                key={`${brief.title}-${index}`}
                                className={cn(
                                  "flex items-start gap-3",
                                  index > 0 &&
                                  "border-t border-slate-200 pt-4",
                                )}
                              >
                                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                                <div>
                                  <p className="font-semibold text-slate-950">
                                    {brief.title}
                                  </p>
                                  {brief.subtitle ? (
                                    <p className="text-sm text-slate-500">
                                      {brief.subtitle}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            ),
                          )
                          : null}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[1.25rem] border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Contact type
                        </p>
                        <p className="mt-3 text-sm font-semibold text-slate-950">
                          Brand
                        </p>
                      </div>
                      <div className="rounded-[1.25rem] border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Status
                        </p>
                        <p
                          className={`mt-3 text-sm font-semibold ${profileDrawerDetails?.active ? "text-emerald-500" : "text-slate-950"}`}
                        >
                          {profileDrawerDetails?.active ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Active brief
                      </p>
                      <p className="mt-3 text-base font-semibold text-slate-950">
                        {profileDrawerDetails.context}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {profileDrawerDetails.campaignTitle
                          ? `Campaign: ${profileDrawerDetails.campaignTitle}`
                          : "No linked campaign title on this thread yet."}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Latest message
                      </p>
                      <p className="mt-3 break-words text-sm leading-6 text-slate-700">
                        {profileDrawerDetails.latestMessagePreview}
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Conversation details
                      </p>
                      <div className="mt-4 space-y-4 text-sm text-slate-600">
                        <div className="flex items-start justify-between gap-4">
                          <span>Started</span>
                          <span className="text-right font-medium text-slate-950">
                            {formatDate(
                              profileDrawerDetails.conversationStartedAt,
                            )}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <span>Latest activity</span>
                          <span className="text-right font-medium text-slate-950">
                            {formatDate(profileDrawerDetails.lastActivity)}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <span>Messages</span>
                          <span className="text-right font-medium text-slate-950">
                            {profileDrawerDetails.messageCount}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <span>Thread type</span>
                          <span className="text-right font-medium text-slate-950">
                            Realtime chat
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileDrawerOpen(false);
                    composerInputRef.current?.focus();
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:border-accent/20 hover:bg-[rgba(7,107,210,0.04)] hover:text-accent"
                >
                  Send message
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-sm text-slate-500">
              Select a conversation to view profile details.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
