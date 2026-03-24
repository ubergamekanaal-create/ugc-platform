import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card/70 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <p className="text-sm text-muted">UGC Platform</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Brand & Creator Portal
        </h1>
        <p className="mt-3 text-sm text-muted">
          Start met een role-based login en ga door naar je dashboard.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/login/brand"
            className="rounded-lg border border-border bg-zinc-900 px-4 py-3 text-center text-sm font-medium transition hover:border-accent hover:text-white"
          >
            Login als Brand
          </Link>
          <Link
            href="/login/creator"
            className="rounded-lg border border-border bg-zinc-900 px-4 py-3 text-center text-sm font-medium transition hover:border-accent hover:text-white"
          >
            Login als Creator
          </Link>
        </div>
      </div>
      </main>
  );
}
