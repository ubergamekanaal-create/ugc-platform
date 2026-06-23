"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";

type WorkspaceLoadingView =
  | "dashboard"
  | "profile"
  | "payouts"
  | "submissions"
  | "submissionDetail"
  | "chat"
  | "ads"
  | "adBuilder"
  | "analytics"
  | "creators"
  | "campaignBuilder"
  | "finance"
  | "integrations"
  | "settings";

function SkeletonBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`animate-pulse bg-slate-100 ${className}`} style={style} />
  );
}

function Panel({
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(7,107,210,0.32),transparent)]" />
      {children}
    </section>
  );
}

function HeaderSkeleton({
  actionCount = 2,
  wide = false,
}: {
  actionCount?: number;
  wide?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center">
      <div className="space-y-3">
        <SkeletonBlock className="h-3 w-24 rounded-full" />
        <SkeletonBlock
          className={`${wide ? "w-72" : "w-52"} h-7 max-w-full rounded-full`}
        />
        <SkeletonBlock className="h-4 w-80 max-w-full rounded-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: actionCount }).map((_, index) => (
          <SkeletonBlock key={index} className="h-11 w-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function MetricGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Panel key={index} className="min-h-[145px] rounded-[1.75rem]">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-28 rounded-full" />
              <SkeletonBlock className="h-8 w-20 rounded-full" />
            </div>
            <SkeletonBlock className="h-11 w-11 rounded-2xl" />
          </div>
          <SkeletonBlock className="mt-7 h-3 w-full rounded-full" />
          <SkeletonBlock className="mt-3 h-3 w-2/3 rounded-full" />
        </Panel>
      ))}
    </div>
  );
}

function TableRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1.5fr)_120px_110px_90px]"
        >
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-52 max-w-full rounded-full" />
            <SkeletonBlock className="h-3 w-32 rounded-full" />
          </div>
          <SkeletonBlock className="h-8 rounded-full" />
          <SkeletonBlock className="h-8 rounded-full" />
          <SkeletonBlock className="h-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel className="min-h-[620px]">
        <div className="space-y-3">
          <SkeletonBlock className="h-7 w-56 rounded-full" />
          <SkeletonBlock className="h-4 w-80 max-w-full rounded-full" />
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={index > 3 ? "md:col-span-2" : ""}>
              <SkeletonBlock className="mb-2 h-3 w-24 rounded-full" />
              <SkeletonBlock
                className={`${index > 3 ? "h-28" : "h-12"} rounded-2xl border border-slate-200 bg-slate-50`}
              />
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="min-h-[420px]">
        <SkeletonBlock className="h-6 w-40 rounded-full" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-3/4 rounded-full" />
                <SkeletonBlock className="h-3 w-1/2 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ProfileFieldSkeleton({
  tall = false,
  wide = false,
}: {
  tall?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <SkeletonBlock className="mb-2 h-3 w-24 rounded-full" />
      <SkeletonBlock
        className={`${tall ? "h-28" : "h-14"} rounded-2xl border border-slate-200 bg-slate-50`}
      />
      {tall ? null : <SkeletonBlock className="mt-2 h-3 w-32 rounded-full" />}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <Panel>
        <SkeletonBlock className="h-8 w-64 rounded-full" />

        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative h-20 w-20 shrink-0">
            <SkeletonBlock className="h-20 w-20 rounded-full bg-slate-200" />
            <SkeletonBlock className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-blue-100" />
          </div>
          <div className="space-y-3">
            <SkeletonBlock className="h-5 w-36 rounded-full" />
            <SkeletonBlock className="h-4 w-80 max-w-full rounded-full" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
            >
              <SkeletonBlock className="h-4 w-28 rounded-full" />
              <SkeletonBlock className="mt-3 h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
          </div>

          <ProfileFieldSkeleton wide />
          <ProfileFieldSkeleton wide />

          <div className="grid gap-5 md:grid-cols-2">
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
            <div className="xl:col-span-2">
              <ProfileFieldSkeleton />
            </div>
          </div>

          <ProfileFieldSkeleton tall wide />

          <div className="grid gap-5 md:grid-cols-2">
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <ProfileFieldSkeleton tall />
            <ProfileFieldSkeleton tall />
          </div>

          <ProfileFieldSkeleton tall wide />

          <div>
            <SkeletonBlock className="h-4 w-44 rounded-full" />
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProfileFieldSkeleton key={index} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SkeletonBlock className="h-10 w-36 rounded-[1.75rem] bg-blue-100" />
            <SkeletonBlock className="h-4 w-52 rounded-full" />
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <SkeletonBlock className="h-6 w-48 rounded-full" />
              <SkeletonBlock className="h-4 w-96 max-w-full rounded-full" />
            </div>
            <SkeletonBlock className="h-10 w-32 rounded-full" />
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex-1">
                <SkeletonBlock className="mb-2 h-4 w-44 rounded-full" />
                <SkeletonBlock className="h-12 rounded-2xl bg-white" />
                <SkeletonBlock className="mt-2 h-3 w-56 rounded-full" />
              </div>
              <SkeletonBlock className="h-12 w-36 rounded-2xl bg-blue-100" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-40 rounded-[1.5rem]" />
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <SkeletonBlock className="h-6 w-28 rounded-full" />
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-40 rounded-full" />
            <SkeletonBlock className="h-4 w-72 max-w-full rounded-full" />
          </div>
          <SkeletonBlock className="h-11 w-28 rounded-full" />
        </div>
      </Panel>
    </>
  );
}

function PayoutsSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Panel key={index} className="rounded-[2rem]">
            <SkeletonBlock className="h-4 w-36 rounded-full" />
            <SkeletonBlock className="mt-3 h-9 w-24 rounded-full" />
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="min-h-[440px]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <SkeletonBlock className="h-8 w-48 rounded-full" />
              <SkeletonBlock className="h-4 w-80 max-w-full rounded-full" />
              <SkeletonBlock className="h-4 w-72 max-w-full rounded-full" />
            </div>
            <SkeletonBlock className="h-7 w-32 rounded-full" />
          </div>

          <div className="mt-8 rounded-[1.75rem] bg-slate-50 p-5">
            <SkeletonBlock className="h-4 w-24 rounded-full" />
            <SkeletonBlock className="mt-3 h-7 w-72 max-w-full rounded-full" />
            <SkeletonBlock className="mt-4 h-4 w-full rounded-full" />
            <SkeletonBlock className="mt-3 h-4 w-5/6 rounded-full" />

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3"
                >
                  <SkeletonBlock className="h-3 w-24 rounded-full" />
                  <SkeletonBlock className="mt-3 h-4 w-12 rounded-full" />
                </div>
              ))}
            </div>

            <SkeletonBlock className="mt-6 h-11 w-44 rounded-full bg-blue-100" />
          </div>
        </Panel>

        <Panel className="min-h-[520px]">
          <SkeletonBlock className="h-8 w-56 rounded-full" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-3">
                  <SkeletonBlock className="h-5 w-52 max-w-full rounded-full" />
                  <SkeletonBlock className="h-4 w-40 rounded-full" />
                  <SkeletonBlock className="h-4 w-72 max-w-full rounded-full" />
                </div>
                <div className="space-y-3 sm:text-right">
                  <SkeletonBlock className="h-5 w-20 rounded-full sm:ml-auto" />
                  <SkeletonBlock className="h-7 w-36 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Panel className="min-h-[310px]">
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
        </Panel>
        <ChartPanel />
      </div>
      <MetricGrid />
      <ActivityGrid />
    </>
  );
}

function ChartPanel() {
  return (
    <Panel className="min-h-[360px]">
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
    </Panel>
  );
}

function ActivityGrid() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel className="min-h-[420px]">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-6 w-44 rounded-full" />
            <SkeletonBlock className="h-4 w-64 max-w-full rounded-full" />
          </div>
          <SkeletonBlock className="h-10 w-28 rounded-full" />
        </div>
        <div className="mt-8">
          <TableRows rows={5} />
        </div>
      </Panel>
      <Panel className="min-h-[420px]">
        <SkeletonBlock className="h-6 w-40 rounded-full" />
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
      </Panel>
    </div>
  );
}

function SubmissionsSkeleton() {
  return (
    <>
      <HeaderSkeleton actionCount={3} wide />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Panel key={index} className="min-h-[120px] rounded-[1.75rem]">
            <SkeletonBlock className="h-4 w-32 rounded-full" />
            <SkeletonBlock className="mt-4 h-8 w-16 rounded-full" />
            <SkeletonBlock className="mt-3 h-3 w-40 max-w-full rounded-full" />
          </Panel>
        ))}
      </div>
      <Panel className="min-h-[560px]">
        <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_120px]">
          <SkeletonBlock className="h-12 rounded-2xl" />
          <SkeletonBlock className="h-12 rounded-2xl" />
          <SkeletonBlock className="h-12 rounded-2xl" />
          <SkeletonBlock className="h-12 rounded-2xl" />
        </div>
        <div className="mt-6">
          <TableRows rows={7} />
        </div>
      </Panel>
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      <HeaderSkeleton actionCount={2} wide />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="min-h-[620px]">
          <SkeletonBlock className="h-8 w-64 rounded-full" />
          <SkeletonBlock className="mt-4 h-4 w-96 max-w-full rounded-full" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-28 rounded-[1.5rem]" />
            ))}
          </div>
          <SkeletonBlock className="mt-6 h-64 rounded-[1.75rem]" />
        </Panel>
        <Panel className="min-h-[500px]">
          <SkeletonBlock className="h-6 w-40 rounded-full" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-14 rounded-[1.25rem]" />
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function ChatSkeleton() {
  return (
    <div className="grid min-h-[720px] gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Panel className="p-4">
        <SkeletonBlock className="h-12 rounded-2xl" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-2xl p-2">
              <SkeletonBlock className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-3/4 rounded-full" />
                <SkeletonBlock className="h-3 w-1/2 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="flex min-h-[720px] flex-col">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <SkeletonBlock className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-40 rounded-full" />
            <SkeletonBlock className="h-3 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex-1 space-y-4 py-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock
              key={index}
              className={`h-14 rounded-3xl ${index % 2 ? "ml-auto w-2/3" : "w-3/4"}`}
            />
          ))}
        </div>
        <SkeletonBlock className="h-14 rounded-2xl" />
      </Panel>
    </div>
  );
}

function AdsSkeleton() {
  return (
    <>
      <HeaderSkeleton actionCount={2} wide />
      <MetricGrid />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="min-h-[520px]">
          <SkeletonBlock className="h-6 w-48 rounded-full" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-20 rounded-[1.5rem]" />
            ))}
          </div>
        </Panel>
        <ChartPanel />
      </div>
    </>
  );
}

function AnalyticsSkeleton() {
  return (
    <>
      <MetricGrid />
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Panel className="min-h-[420px]">
          <SkeletonBlock className="h-7 w-56 rounded-full" />
          <div className="mt-8 space-y-6">
            {[86, 72, 58, 44, 32].map((width, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <SkeletonBlock className="h-4 w-40 rounded-full" />
                  <SkeletonBlock className="h-4 w-16 rounded-full" />
                </div>
                <SkeletonBlock
                  className="mt-3 h-4 rounded-full"
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="min-h-[420px]">
          <SkeletonBlock className="h-7 w-52 rounded-full" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-28 rounded-[1.5rem]" />
            ))}
          </div>
        </Panel>
      </div>
      <ActivityGrid />
    </>
  );
}

function CreatorsSkeleton() {
  return (
    <>
      <HeaderSkeleton actionCount={2} wide />
      <Panel>
        <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_150px]">
          <SkeletonBlock className="h-12 rounded-2xl" />
          <SkeletonBlock className="h-12 rounded-2xl" />
          <SkeletonBlock className="h-12 rounded-2xl" />
          <SkeletonBlock className="h-12 rounded-2xl" />
        </div>
      </Panel>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <Panel key={index} className="min-h-[300px] rounded-[2rem]">
            <div className="flex items-start gap-4">
              <SkeletonBlock className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-5 w-36 rounded-full" />
                <SkeletonBlock className="h-3 w-24 rounded-full" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <SkeletonBlock className="h-16 rounded-[1rem]" />
              <SkeletonBlock className="h-16 rounded-[1rem]" />
              <SkeletonBlock className="h-16 rounded-[1rem]" />
            </div>
            <SkeletonBlock className="mt-6 h-4 w-full rounded-full" />
            <SkeletonBlock className="mt-3 h-4 w-2/3 rounded-full" />
            <SkeletonBlock className="mt-6 h-11 rounded-2xl" />
          </Panel>
        ))}
      </div>
    </>
  );
}

function FinanceSkeleton() {
  return (
    <>
      <HeaderSkeleton actionCount={2} wide />
      <MetricGrid />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel className="min-h-[520px]">
          <SkeletonBlock className="h-7 w-48 rounded-full" />
          <div className="mt-8">
            <TableRows rows={7} />
          </div>
        </Panel>
        <Panel className="min-h-[520px]">
          <SkeletonBlock className="h-7 w-44 rounded-full" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-20 rounded-[1.5rem]" />
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function IntegrationsSkeleton() {
  return (
    <>
      <HeaderSkeleton actionCount={1} wide />
      <Panel className="min-h-[420px]">
        <SkeletonBlock className="h-7 w-64 rounded-full" />
        <SkeletonBlock className="mt-4 h-4 w-96 max-w-full rounded-full" />
        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-36 rounded-[1.75rem]" />
          ))}
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <SkeletonBlock className="h-14 rounded-2xl" />
          <SkeletonBlock className="h-14 rounded-2xl" />
          <SkeletonBlock className="h-12 rounded-2xl md:col-span-2" />
        </div>
      </Panel>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Panel className="min-h-[360px]">
          <SkeletonBlock className="h-6 w-44 rounded-full" />
          <div className="mt-8">
            <TableRows rows={4} />
          </div>
        </Panel>
        <Panel className="min-h-[360px]">
          <SkeletonBlock className="h-6 w-52 rounded-full" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-16 rounded-[1.25rem]" />
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex min-h-screen flex-col gap-6 md:flex-row">
      <Panel className="min-h-[500px] md:w-80">
        <SkeletonBlock className="h-7 w-40 rounded-full" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-14 rounded-[1.25rem]" />
          ))}
        </div>
      </Panel>
      <Panel className="min-h-[620px] flex-1">
        <SkeletonBlock className="h-8 w-56 rounded-full" />
        <SkeletonBlock className="mt-4 h-4 w-80 max-w-full rounded-full" />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={index > 3 ? "md:col-span-2" : ""}>
              <SkeletonBlock className="mb-2 h-3 w-24 rounded-full" />
              <SkeletonBlock
                className={`${index > 3 ? "h-28" : "h-12"} rounded-2xl border border-slate-200 bg-slate-50`}
              />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function getViewFromPath(pathname: string): WorkspaceLoadingView {
  if (pathname.includes("/submissions/queue/") || pathname.includes("/submissions/deliveries/")) {
    return "submissionDetail";
  }

  if (pathname.includes("/creators/campaigns/")) {
    return "campaignBuilder";
  }

  if (pathname.includes("/ads/new")) {
    return "adBuilder";
  }

  if (pathname.includes("/dashboard/submissions")) return "submissions";
  if (pathname.includes("/dashboard/profile")) return "profile";
  if (pathname.includes("/dashboard/payouts")) return "payouts";
  if (pathname.includes("/dashboard/chat")) return "chat";
  if (pathname.includes("/dashboard/ads")) return "ads";
  if (pathname.includes("/dashboard/analytics")) return "analytics";
  if (pathname.includes("/dashboard/creators")) return "creators";
  if (pathname.includes("/dashboard/discovery")) return "creators";
  if (pathname.includes("/dashboard/finance")) return "finance";
  if (pathname.includes("/dashboard/integrations")) return "integrations";
  if (pathname.includes("/dashboard/settings")) return "settings";

  return "dashboard";
}

function renderView(view: WorkspaceLoadingView) {
  switch (view) {
    case "profile":
      return <ProfileSkeleton />;
    case "payouts":
      return <PayoutsSkeleton />;
    case "submissions":
      return <SubmissionsSkeleton />;
    case "submissionDetail":
      return <DetailSkeleton />;
    case "chat":
      return <ChatSkeleton />;
    case "ads":
      return <AdsSkeleton />;
    case "adBuilder":
    case "campaignBuilder":
      return (
        <>
          <HeaderSkeleton actionCount={2} wide />
          <FormSkeleton />
        </>
      );
    case "analytics":
      return <AnalyticsSkeleton />;
    case "creators":
      return <CreatorsSkeleton />;
    case "finance":
      return <FinanceSkeleton />;
    case "integrations":
      return <IntegrationsSkeleton />;
    case "settings":
      return <SettingsSkeleton />;
    case "dashboard":
    default:
      return <DashboardSkeleton />;
  }
}

export default function DashboardWorkspaceLoading() {
  const pathname = usePathname();
  const view = getViewFromPath(pathname ?? "/dashboard");

  return (
    <main className="min-w-0 px-4 pb-24 pt-5 md:pb-6 md:pr-4">
      <div className="space-y-6">{renderView(view)}</div>
    </main>
  );
}
