export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(7,107,210,0.1),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#f3f6fb_48%,_#eef2f8_100%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1660px] animate-pulse lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 bg-white/85 px-5 py-5 lg:border-b-0 lg:border-r lg:px-6">
          <div className="h-24 rounded-[2rem] border border-slate-200 bg-white" />
          <div className="mt-10 space-y-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="h-14 rounded-[1.25rem] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              />
            ))}
          </div>
        </aside>
        <div className="space-y-6 px-4 py-5 sm:px-6 lg:px-8">
          <div className="h-20 rounded-[2rem] border border-blue-100 bg-blue-50/70" />
          <div className="h-40 rounded-[2rem] border border-slate-200 bg-white" />
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-[380px] rounded-[2rem] border border-slate-200 bg-white" />
            <div className="h-[380px] rounded-[2rem] border border-slate-200 bg-white" />
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="h-[420px] rounded-[2rem] border border-slate-200 bg-white" />
            <div className="h-[420px] rounded-[2rem] border border-slate-200 bg-white" />
          </div>
        </div>
      </div>
    </main>
  );
}
