"use client";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onChange }: Props) {
  return (
    <div className="mt-6 grid grid-cols-[minmax(2.75rem,1fr)_auto_minmax(2.75rem,1fr)] items-center gap-1.5 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-2 min-[420px]:gap-3 min-[420px]:p-3">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Go to previous page"
        className="inline-flex h-10 min-w-10 items-center justify-center gap-1.5 justify-self-start rounded-2xl border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.05)] hover:text-accent disabled:cursor-not-allowed disabled:bg-white disabled:text-slate-300 disabled:shadow-none min-[420px]:h-11 min-[420px]:gap-2 min-[420px]:px-3 sm:px-4"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden min-[360px]:inline">Prev</span>
      </button>

      <div className="flex items-center justify-center gap-1.5 text-sm min-[420px]:gap-2">
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-2xl bg-white px-2 font-semibold text-slate-950 shadow-[0_8px_20px_rgba(15,23,42,0.04)] min-[420px]:h-10 min-[420px]:min-w-10 min-[420px]:px-3">
          {page}
        </span>
        <span className="font-medium text-slate-400">of</span>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 font-semibold text-slate-600 min-[420px]:h-10 min-[420px]:min-w-10 min-[420px]:px-3">
          {totalPages}
        </span>
      </div>

      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Go to next page"
        className="inline-flex h-10 min-w-10 items-center justify-center gap-1.5 justify-self-end rounded-2xl border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:border-accent/25 hover:bg-[rgba(7,107,210,0.05)] hover:text-accent disabled:cursor-not-allowed disabled:bg-white disabled:text-slate-300 disabled:shadow-none min-[420px]:h-11 min-[420px]:gap-2 min-[420px]:px-3 sm:px-4"
      >
        <span className="hidden min-[360px]:inline">Next</span>
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
