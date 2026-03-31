"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { Role } from "@/lib/types";

type SignupFormProps = {
  initialRole: Role;
};

const roleCopy: Record<Role, { title: string; subtitle: string }> = {
  brand: {
    title: "Create a brand workspace",
    subtitle: "Set up campaign operations, payouts, and collaboration workflows.",
  },
  creator: {
    title: "Create a creator profile",
    subtitle: "Join the marketplace, apply to campaigns, and track earnings in one hub.",
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
    <section className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,_rgba(10,16,27,0.98),_rgba(8,12,20,0.94))] p-6 shadow-panel sm:p-8">
      <div className="space-y-6">
        <div className="flex gap-3">
          {(["creator", "brand"] as Role[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRole(option)}
              className={`flex-1 rounded-2xl border px-4 py-3 text-sm transition ${
                role === option
                  ? "border-accent/25 bg-accent/10 text-white"
                  : "border-white/8 bg-white/[0.03] text-muted hover:text-white"
              }`}
            >
              {option === "brand" ? "Brand" : "Creator"}
            </button>
          ))}
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">{copy.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{copy.subtitle}</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="full-name" className="mb-2 block text-sm text-muted">
              {role === "brand" ? "Primary contact" : "Full name"}
            </label>
            <input
              id="full-name"
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={role === "brand" ? "Avery Jordan" : "Riley Cole"}
              className="w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/35"
            />
          </div>
          {role === "brand" ? (
            <div>
              <label
                htmlFor="company-name"
                className="mb-2 block text-sm text-muted"
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
                className="w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/35"
              />
            </div>
          ) : null}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={role === "brand" ? "team@northstar.com" : "creator@example.com"}
              className="w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/35"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-muted">
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
              className="w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-accent/35"
            />
          </div>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {success ? <p className="text-sm text-success/90">{success}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 py-3 text-sm font-semibold text-white transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link
            href={`/login?role=${role}`}
            className="text-accent/80 transition hover:text-white"
          >
            Login
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
