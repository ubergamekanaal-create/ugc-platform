"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetHint, setResetHint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResetHint(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as {
        error?: string;
        redirectTo?: string;
      };

      if (!response.ok || !payload.redirectTo) {
        throw new Error(payload.error ?? "Unable to sign in.");
      }

      window.location.assign(payload.redirectTo);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form className="w-full space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            className="h-14 w-full rounded-2xl border border-slate-300/80 bg-white/80 px-5 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-accent/45 focus:bg-white focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="h-14 w-full rounded-2xl border border-slate-300/80 bg-white/80 px-5 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-accent/45 focus:bg-white focus:shadow-[0_0_0_4px_rgba(7,107,210,0.08)]"
          />
        </div>
      </div>

      <div className="space-y-3 text-left">
        <button
          type="button"
          onClick={() =>
            setResetHint(
              "Forgot password flow can be connected to Supabase recovery emails from here.",
            )
          }
          className="text-sm font-medium text-accent transition hover:text-accent/80"
        >
          Forgot your password?
        </button>
        {resetHint ? (
          <p className="text-sm text-slate-500">{resetHint}</p>
        ) : null}
        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-14 w-full rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-5 text-base font-semibold text-white shadow-[0_24px_60px_rgba(7,107,210,0.2)] transition hover:translate-y-[-1px] hover:shadow-[0_28px_70px_rgba(7,107,210,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-base text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-accent transition hover:text-accent/80"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
