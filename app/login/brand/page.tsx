"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BrandLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    const supabase = createClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Inloggen is mislukt.");
      setIsLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || profile?.role !== "brand") {
      await supabase.auth.signOut();
      setError("Dit account heeft geen brand-toegang.");
      setIsLoading(false);
      return;
    }

    router.push("/brand/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-14">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card/70 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <p className="text-sm text-muted">Brand Login</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Inloggen als Brand
        </h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
              placeholder="team@brand.com"
              className="w-full rounded-lg border border-border bg-zinc-900 px-3 py-2 text-sm outline-none ring-0 transition placeholder:text-zinc-500 focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-muted">
              Wachtwoord
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              className="w-full rounded-lg border border-border bg-zinc-900 px-3 py-2 text-sm outline-none ring-0 transition placeholder:text-zinc-500 focus:border-accent"
            />
          </div>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Bezig..." : "Inloggen als Brand"}
          </button>
        </form>
        <p className="mt-4 text-xs text-muted">
          Ben je creator?{" "}
          <Link href="/login/creator" className="text-zinc-200 hover:underline">
            Login als creator
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
