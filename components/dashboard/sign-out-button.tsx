"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  variant?: "dark" | "light";
};

export function SignOutButton({ variant = "dark" }: SignOutButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      const payload = (await response.json()) as { redirectTo?: string };

      window.location.assign(payload.redirectTo ?? "/login");
    } catch {
      window.location.assign("/login");
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "light"
          ? "border border-slate-200 bg-white text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:bg-slate-50"
          : "border border-white/10 bg-white/5 text-white hover:border-accent/30 hover:bg-white/8",
      )}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
