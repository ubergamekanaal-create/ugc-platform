import type { CSSProperties, ReactNode } from "react";

function SkeletonBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse bg-slate-100 ${className}`}
      style={style}
    />
  );
}

function SkeletonPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(7,107,210,0.3),transparent)]" />
      {children}
    </section>
  );
}

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1720px] md:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-slate-300 bg-white pb-5 pt-3 md:block">
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-10 w-10 rounded-2xl" />
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-24 rounded-full" />
                <SkeletonBlock className="h-3 w-16 rounded-full" />
              </div>
            </div>
          </div>

          <div className="px-4 pt-4">
            <div className="rounded-3xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="h-11 w-11 rounded-full" />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-4 w-28 rounded-full" />
                    <SkeletonBlock className="h-3 w-16 rounded-full" />
                  </div>
                </div>
                <SkeletonBlock className="h-5 w-5 rounded-full" />
              </div>
            </div>

            <nav className="mt-6 space-y-5">
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={
                      index === 0
                        ? "rounded-[1.35rem] border border-[rgba(7,107,210,0.16)] bg-[rgba(7,107,210,0.08)] px-3 py-3 shadow-[0_14px_30px_rgba(7,107,210,0.08)]"
                        : "rounded-[1.35rem] border border-transparent px-3 py-3"
                    }
                  >
                    <div className="flex items-center gap-3">
                      <SkeletonBlock className="h-5 w-5 rounded-md" />
                      <SkeletonBlock className="h-4 w-28 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <SkeletonBlock className="ml-2 h-3 w-20 rounded-full" />
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-[1.35rem] px-3 py-3">
                    <div className="flex items-center gap-3">
                      <SkeletonBlock className="h-5 w-5 rounded-md" />
                      <SkeletonBlock className="h-4 w-24 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 px-4 pb-24 pt-5 md:pb-6 md:pr-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] md:hidden">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-10 w-10 rounded-2xl" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-28 rounded-full" />
                  <SkeletonBlock className="h-3 w-20 rounded-full" />
                </div>
              </div>
              <SkeletonBlock className="h-10 w-10 rounded-full" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
              <SkeletonPanel className="min-h-[310px]">
                <div className="flex items-center justify-between">
                  <SkeletonBlock className="h-6 w-44 rounded-full" />
                  <SkeletonBlock className="h-5 w-5 rounded-full" />
                </div>

                <div className="mt-8 space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 px-3 py-3"
                    >
                      <div className="flex items-center gap-4">
                        <SkeletonBlock className="h-8 w-8 rounded-full" />
                        <SkeletonBlock className="h-4 w-36 rounded-full" />
                      </div>
                      <SkeletonBlock className="h-5 w-5 rounded-full" />
                    </div>
                  ))}
                </div>
              </SkeletonPanel>

              <SkeletonPanel className="min-h-[360px]">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                  <div className="space-y-3">
                    <SkeletonBlock className="h-4 w-24 rounded-full" />
                    <SkeletonBlock className="h-8 w-56 rounded-full" />
                    <SkeletonBlock className="h-4 w-72 max-w-full rounded-full" />
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <SkeletonBlock key={index} className="h-9 w-14 rounded-full" />
                    ))}
                  </div>
                </div>

                <div className="mt-10 flex h-48 items-end gap-3 rounded-[1.5rem] bg-slate-50 px-4 py-5">
                  {[34, 58, 44, 72, 50, 86, 64, 92, 70, 82, 56, 76].map(
                    (height, index) => (
                      <SkeletonBlock
                        key={index}
                        className="flex-1 rounded-t-2xl"
                        style={{ height: `${height}%` }}
                      />
                    ),
                  )}
                </div>
              </SkeletonPanel>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonPanel key={index} className="min-h-[150px] rounded-[1.75rem]">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <SkeletonBlock className="h-4 w-28 rounded-full" />
                      <SkeletonBlock className="h-8 w-20 rounded-full" />
                    </div>
                    <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                  </div>
                  <SkeletonBlock className="mt-7 h-3 w-full rounded-full" />
                  <SkeletonBlock className="mt-3 h-3 w-2/3 rounded-full" />
                </SkeletonPanel>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <SkeletonPanel className="min-h-[420px]">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-3">
                    <SkeletonBlock className="h-6 w-44 rounded-full" />
                    <SkeletonBlock className="h-4 w-64 max-w-full rounded-full" />
                  </div>
                  <SkeletonBlock className="h-10 w-28 rounded-full" />
                </div>

                <div className="mt-8 space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_120px_90px]"
                    >
                      <div className="space-y-2">
                        <SkeletonBlock className="h-4 w-48 max-w-full rounded-full" />
                        <SkeletonBlock className="h-3 w-32 rounded-full" />
                      </div>
                      <SkeletonBlock className="h-8 w-full rounded-full" />
                      <SkeletonBlock className="h-8 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </SkeletonPanel>

              <SkeletonPanel className="min-h-[420px]">
                <div className="space-y-3">
                  <SkeletonBlock className="h-6 w-40 rounded-full" />
                  <SkeletonBlock className="h-4 w-56 max-w-full rounded-full" />
                </div>

                <div className="mt-8 space-y-5">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <SkeletonBlock className="h-12 w-12 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <SkeletonBlock className="h-4 w-3/4 rounded-full" />
                        <SkeletonBlock className="h-3 w-1/2 rounded-full" />
                      </div>
                      <SkeletonBlock className="h-8 w-16 rounded-full" />
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-[1.5rem] bg-slate-50 p-4">
                  <SkeletonBlock className="h-4 w-32 rounded-full" />
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <SkeletonBlock className="h-20 rounded-[1.25rem]" />
                    <SkeletonBlock className="h-20 rounded-[1.25rem]" />
                    <SkeletonBlock className="h-20 rounded-[1.25rem]" />
                  </div>
                </div>
              </SkeletonPanel>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 md:hidden">
        <div className="flex items-center gap-6 rounded-full border border-gray-200 bg-white px-6 py-1 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-10 w-10 rounded-full" />
          ))}
        </div>
        <SkeletonBlock className="h-12 w-12 rounded-full border border-gray-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.15)]" />
      </div>
    </main>
  );
}
