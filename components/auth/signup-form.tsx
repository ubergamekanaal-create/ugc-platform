"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

type SignupFormProps = {
  initialRole: Role;
};

const roleCopy: Record<
  Role,
  {
    label: string;
    title: string;
    subtitle: string;
    points: string[];
  }
> = {
  brand: {
    label: "Brand",
    title: "Create a brand workspace",
    subtitle:
      "Set up campaign operations, creator outreach, reviews, and payout workflows.",
    points: [
      "Launch campaign briefs and manage creator invites.",
      "Review applications, submissions, and approvals in one place.",
      "Track funding, payouts, and delivery operations cleanly.",
    ],
  },
  creator: {
    label: "Creator",
    title: "Create a creator profile",
    subtitle:
      "Join the marketplace, respond to invites, submit work, and track earnings.",
    points: [
      "Apply to campaigns and manage brand invites.",
      "Handle revisions and approved deliveries from one hub.",
      "Track payout readiness and profile completeness in one workflow.",
    ],
  },
};

export function SignupForm({ initialRole }: SignupFormProps) {
  const [role, setRole] = useState<Role>(initialRole);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = useMemo(() => roleCopy[role], [role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    if (role === "brand" && !companyName.trim()) {
      setError("Company name is required for brand accounts.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          fullName,
          companyName,
          email,
          password,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create account.");
      }

      if (payload.redirectTo) {
        window.location.assign(payload.redirectTo);
        return;
      }

      setSuccess(
        payload.message ??
          "Account created. Check your email to confirm your address.",
      );
      setIsSubmitting(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create account.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_32px_90px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,_rgba(231,242,255,0.9),_rgba(255,255,255,0.96))] px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              Account setup
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              {copy.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              {copy.subtitle}
            </p>
          </div>
          <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            Supabase-backed signup
          </span>
        </div>
      </div>

      <div className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-3 sm:grid-cols-2">
          {(["creator", "brand"] as Role[]).map((option) => {
            const optionCopy = roleCopy[option];

            return (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                className={cn(
                  "rounded-[1.5rem] border p-5 text-left transition",
                  role === option
                    ? "border-accent/20 bg-[linear-gradient(135deg,_rgba(7,107,210,0.08),_rgba(255,255,255,0.98))] shadow-[0_16px_36px_rgba(7,107,210,0.08)]"
                    : "border-slate-200 bg-white hover:border-accent/15 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                      role === option
                        ? "bg-white text-accent"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {optionCopy.label}
                  </span>
                  {role === option ? (
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      Selected
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-950">
                  {optionCopy.title}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  {optionCopy.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Included in setup
          </p>
          <div className="mt-4 space-y-3">
            {copy.points.map((point) => (
              <div key={point} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(7,107,210,0.12)] text-[11px] font-semibold text-accent">
                  +
                </span>
                <span className="leading-7">{point}</span>
              </div>
            ))}
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className={cn(role === "brand" ? "" : "sm:col-span-2")}>
              <label
                htmlFor="full-name"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                {role === "brand" ? "Primary contact" : "Full name"}
              </label>
              <input
                id="full-name"
                type="text"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={role === "brand" ? "Avery Jordan" : "Riley Cole"}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>

            {role === "brand" ? (
              <div>
                <label
                  htmlFor="company-name"
                  className="mb-2 block text-sm font-medium text-slate-600"
                >
                  Company name
                </label>
                <input
                  id="company-name"
                  type="text"
                  required
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Northstar Labs"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
                />
              </div>
            ) : null}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={
                  role === "brand" ? "team@northstar.com" : "creator@example.com"
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-500">
            Your account is created with the selected role and routed into the
            matching CIRCL workspace after authentication.
          </p>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-full rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-base font-semibold text-white shadow-[0_24px_60px_rgba(7,107,210,0.2)] transition hover:translate-y-[-1px] hover:shadow-[0_28px_70px_rgba(7,107,210,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-accent transition hover:text-accent/80">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-accent transition hover:text-accent/80">
              Privacy Policy
            </Link>
            .
          </p>
          <p>
            Already have an account?{" "}
            <Link
              href={`/login?role=${role}`}
              className="font-medium text-accent transition hover:text-accent/80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
