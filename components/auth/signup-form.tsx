"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleBrandSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim() || !companyName.trim() || !email.trim()) {
      setError("Primary contact, company name, and email are required.");
      return;
    }

    if (password.length < 6) {
      setError("Use a password with at least 6 characters.");
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
          role: "brand",
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
        throw new Error(payload.error ?? "Unable to create the brand account.");
      }

      if (payload.redirectTo) {
        window.location.assign(payload.redirectTo);
        return;
      }

      setSuccess(
        payload.message ??
          "Brand account created. Check your email to confirm your address.",
      );
      setIsSubmitting(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create the brand account.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 shadow-[0_32px_90px_rgba(15,23,42,0.12)] backdrop-blur">
      <div className="border-b border-slate-200/80 bg-white/90 px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              Brand signup
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Create a brand workspace
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Enter the core account details to get started.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
        <form className="space-y-5" onSubmit={handleBrandSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="brand-full-name"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Primary contact
              </label>
              <input
                id="brand-full-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Avery Jordan"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
            <div>
              <label
                htmlFor="brand-company-name"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Company name
              </label>
              <input
                id="brand-company-name"
                type="text"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Northstar Labs"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
            <div>
              <label
                htmlFor="brand-email"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Email
              </label>
              <input
                id="brand-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="team@northstar.com"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
            <div>
              <label
                htmlFor="brand-password"
                className="mb-2 block text-sm font-medium text-slate-600"
              >
                Password
              </label>
              <input
                id="brand-password"
                type="password"
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent/45 focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
              />
            </div>
          </div>

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
            {isSubmitting ? "Creating brand account..." : "Create brand account"}
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
              href="/login?role=brand"
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
