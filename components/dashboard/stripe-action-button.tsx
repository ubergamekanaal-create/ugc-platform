"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type StripeActionButtonProps = {
  endpoint: string;
  payload?: Record<string, string | number | null>;
  label: string;
  pendingLabel: string;
  tone?: "dark" | "light";
  disabled?: boolean;
};

export function StripeActionButton({
  endpoint,
  payload,
  label,
  pendingLabel,
  tone = "dark",
  disabled = false,
}: StripeActionButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setMessage(null);
    setIsPending(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload ?? {}),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to start Stripe flow.");
      }

      if (!data.url) {
        throw new Error("Stripe did not return a redirect URL.");
      }

      window.location.assign(data.url);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to start Stripe flow.",
      );
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || disabled}
        className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 py-3 text-sm font-semibold text-white transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? pendingLabel : label}
      </button>
      {message ? (
        <p
          className={cn(
            "text-sm",
            tone === "light" ? "text-rose-600" : "text-rose-300",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
