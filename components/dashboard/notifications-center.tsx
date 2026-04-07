"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NotificationItem, UserProfile } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type NotificationsCenterProps = {
  profile: UserProfile& { role: "brand" | "creator" };
};

type NotificationsResponse = {
  notifications?: NotificationItem[];
  error?: string;
};

function sortNotifications(items: NotificationItem[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

function normalizeNotificationRow(row: Record<string, unknown>): NotificationItem {
  const type =
    row.type === "campaign_invitation" ||
    row.type === "invitation_response" ||
    row.type === "chat_message" ||
    row.type === "submission_submitted" ||
    row.type === "submission_revision_requested" ||
    row.type === "submission_approved" ||
    row.type === "submission_rejected"
      ? row.type
      : "chat_message";

  return {
    id: typeof row.id === "string" ? row.id : "",
    user_id: typeof row.user_id === "string" ? row.user_id : "",
    actor_id: typeof row.actor_id === "string" ? row.actor_id : null,
    type,
    title: typeof row.title === "string" ? row.title : "Notification",
    body: typeof row.body === "string" ? row.body : "",
    link: typeof row.link === "string" ? row.link : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    read_at: typeof row.read_at === "string" ? row.read_at : null,
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date().toISOString(),
  };
}

export function NotificationsCenter({ profile }: NotificationsCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  );

  async function loadNotifications() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const payload = (await response.json()) as NotificationsResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load notifications.");
      }

      setNotifications(sortNotifications(payload.notifications ?? []));
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to load notifications.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read_at: new Date().toISOString() }
          : notification,
      ),
    );

    await fetch(`/api/notifications/${notificationId}`, {
      method: "PATCH",
    }).catch(() => null);
  }

  async function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? new Date().toISOString(),
      })),
    );

    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "read_all" }),
    }).catch(() => null);

    if (!response?.ok) {
      setFeedback("Unable to mark notifications as read.");
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      window.addEventListener("mousedown", handlePointerDown);
    }

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const nextNotification = normalizeNotificationRow(
            payload.new as Record<string, unknown>,
          );

          setNotifications((current) =>
            sortNotifications([
              nextNotification,
              ...current.filter(
                (notification) => notification.id !== nextNotification.id,
              ),
            ]),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const nextNotification = normalizeNotificationRow(
            payload.new as Record<string, unknown>,
          );

          setNotifications((current) =>
            sortNotifications(
              current.map((notification) =>
                notification.id === nextNotification.id
                  ? nextNotification
                  : notification,
              ),
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile.id]);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-slate-950"
        aria-label="Open notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 flex min-w-[1.3rem] items-center justify-center rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-1.5 py-0.5 text-[0.7rem] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute lg:right-0 z-40 mt-3 w-[24rem] max-w-[calc(100vw-2rem)] rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between gap-4 px-1 pb-3">
            <div>
              <p className="text-lg font-semibold text-slate-950">Notifications</p>
              <p className="text-sm text-slate-500">
                {unreadCount ? `${unreadCount} unread` : "You are all caught up"}
              </p>
            </div>
            {unreadCount ? (
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="text-sm font-medium text-accent transition hover:text-blue-500"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="rounded-[1.25rem] border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length ? (
              notifications.map((notification) => {
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-slate-950">
                        {notification.title}
                      </p>
                      <span className="text-xs text-slate-400">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {notification.body}
                    </p>
                  </>
                );

                const baseClassName = cn(
                  "block rounded-[1.25rem] border px-4 py-4 text-left transition",
                  notification.read_at
                    ? "border-slate-200 bg-white"
                    : "border-blue-100 bg-blue-50/40",
                );

                if (notification.link) {
                  return (
                    <Link
                      key={notification.id}
                      href={notification.link}
                      onClick={() => {
                        void markAsRead(notification.id);
                        setIsOpen(false);
                      }}
                      className={baseClassName}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void markAsRead(notification.id)}
                    className={cn(baseClassName, "w-full")}
                  >
                    {content}
                  </button>
                );
              })
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                No notifications yet.
              </div>
            )}
          </div>

          {feedback ? <p className="mt-3 text-sm text-slate-500">{feedback}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <path d="M6 10a6 6 0 1 1 12 0v4l1.8 2.2H4.2L6 14Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}
