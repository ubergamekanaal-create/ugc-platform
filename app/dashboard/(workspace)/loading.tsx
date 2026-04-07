export default function DashboardWorkspaceLoading() {
  return (
    <main className="min-w-0 space-y-4 animate-pulse">
      <div className="h-28 rounded-[2rem] border border-blue-100/80 bg-white" />
      <div className="h-52 rounded-[2.5rem] border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[340px] rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.05)]" />
        <div className="h-[340px] rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.05)]" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="h-[420px] rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.05)]" />
        <div className="h-[420px] rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.05)]" />
      </div>
    </main>
  );
}
