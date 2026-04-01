"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { PageTransition } from "@/components/shared/motion";
import { cn } from "@/lib/utils";

export type WorkspaceShellTone = "brand" | "creator";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  badge?: string | null;
};

export type WorkspaceNavGroup = {
  label?: string;
  items: WorkspaceNavItem[];
};

type WorkspacePanelProps = {
  className?: string;
  children: ReactNode;
};

type WorkspaceShellProps = {
  tone: WorkspaceShellTone;
  displayName: string;
  roleLabel: string;
  initials: string;
  eyebrow: string;
  title: string;
  description: string;
  navGroups: WorkspaceNavGroup[];
  metaItems?: Array<{ label: string; value: string }>;
  topBanner?: ReactNode;
  headerActions?: ReactNode;
  sidebarFooter?: ReactNode;
  showTopBanner?: boolean;
  showHeroSection?: boolean;
  children: ReactNode;
};

const toneClasses: Record<
  WorkspaceShellTone,
  {
    shell: string;
    pill: string;
    avatar: string;
    sidebarAccent: string;
    heroAccent: string;
  }
> = {
  brand: {
    shell:
      "bg-[radial-gradient(circle_at_top_left,_rgba(7,107,210,0.18),_transparent_24%),radial-gradient(circle_at_88%_12%,_rgba(7,107,210,0.12),_transparent_20%),linear-gradient(180deg,_#f7fbff_0%,_#eef4fb_52%,_#edf1f7_100%)]",
    pill: "border-[rgba(7,107,210,0.14)] bg-[rgba(7,107,210,0.08)] text-accent",
    avatar:
      "bg-[linear-gradient(145deg,_rgba(10,17,32,0.98),_rgba(17,24,39,0.92))]",
    sidebarAccent:
      "bg-[radial-gradient(circle_at_top_right,_rgba(7,107,210,0.3),_transparent_58%)]",
    heroAccent:
      "bg-[radial-gradient(circle,_rgba(7,107,210,0.18),_transparent_70%)]",
  },
  creator: {
    shell:
      "bg-[radial-gradient(circle_at_top_left,_rgba(7,107,210,0.14),_transparent_24%),radial-gradient(circle_at_88%_10%,_rgba(7,107,210,0.1),_transparent_20%),linear-gradient(180deg,_#fffdf9_0%,_#f7faff_50%,_#f5f7fb_100%)]",
    pill: "border-[rgba(7,107,210,0.14)] bg-[rgba(7,107,210,0.08)] text-accent",
    avatar:
      "bg-[linear-gradient(145deg,_rgba(21,26,46,0.98),_rgba(36,17,54,0.9))]",
    sidebarAccent:
      "bg-[radial-gradient(circle_at_top_right,_rgba(7,107,210,0.24),_transparent_58%)]",
    heroAccent:
      "bg-[radial-gradient(circle,_rgba(7,107,210,0.16),_transparent_70%)]",
  },
};

export function WorkspacePanel({ className, children }: WorkspacePanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/82 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(7,107,210,0.42),transparent)]" />
      {children}
    </div>
  );
}

export function WorkspaceShell({
  tone,
  displayName,
  roleLabel,
  initials,
  eyebrow,
  title,
  description,
  navGroups,
  metaItems,
  topBanner,
  headerActions,
  sidebarFooter,
  showTopBanner = true,
  showHeroSection = true,
  children,
}: WorkspaceShellProps) {
  const theme = toneClasses[tone];

  return (
    <PageTransition className={cn("relative min-h-screen text-slate-950", theme.shell)}>
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative mx-auto grid max-w-[1720px] gap-4 p-4 lg:min-h-screen lg:grid-cols-[320px_minmax(0,1fr)] lg:p-6">
        <aside className="overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/76 p-5 shadow-[0_26px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <BrandMark tone="light" />
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
                theme.pill,
              )}
            >
              {roleLabel}
            </span>
          </div>

          <div
            className={cn(
              "relative mt-6 overflow-hidden rounded-[2rem] border border-slate-200/20 p-5 text-white shadow-[0_24px_55px_rgba(15,23,42,0.18)]",
              theme.avatar,
            )}
          >
            <div className={cn("absolute inset-0", theme.sidebarAccent)} />
            <div className="relative flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/12 bg-white/10 text-sm font-semibold backdrop-blur">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{displayName}</p>
                <p className="mt-1 text-sm text-slate-300">
                  Everything operational lives here.
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-8 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label ?? "primary"}>
                {group.label ? (
                  <p className="px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {group.label}
                  </p>
                ) : null}
                <div className={cn("space-y-2", group.label ? "mt-3" : "")}>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={item.active ? "page" : undefined}
                      className={cn(
                        "group flex items-center justify-between rounded-[1.35rem] border px-4 py-3.5 transition",
                        item.active
                          ? "border-[rgba(7,107,210,0.16)] bg-[rgba(7,107,210,0.08)] text-accent shadow-[0_14px_30px_rgba(7,107,210,0.12)]"
                          : "border-transparent text-slate-600 hover:border-white hover:bg-white/58 hover:text-slate-950",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-[1rem] transition",
                            item.active
                              ? "bg-[color:#076BD2] text-white shadow-[0_12px_24px_rgba(7,107,210,0.24)]"
                              : "bg-white/88 text-slate-500 group-hover:bg-[color:#076BD2] group-hover:text-white",
                          )}
                        >
                          {item.icon}
                        </span>
                        <span className="text-base font-medium">{item.label}</span>
                      </div>
                      {item.badge ? (
                        <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-500">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {sidebarFooter ? <div className="mt-8">{sidebarFooter}</div> : null}
        </aside>

        <main className="min-w-0 space-y-4">
          {showTopBanner ? topBanner : null}

          {showHeroSection ? (
            <section className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.88),_rgba(244,248,255,0.9))] px-6 py-6 shadow-[0_28px_90px_rgba(15,23,42,0.09)] backdrop-blur-xl sm:px-8 sm:py-8">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(7,107,210,0.5),transparent)]" />
              <div className={cn("pointer-events-none absolute -right-16 -top-16 h-48 w-48", theme.heroAccent)} />

              <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-4xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    {eyebrow}
                  </p>
                  <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    {title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                    {description}
                  </p>

                  {metaItems?.length ? (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {metaItems.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-full border border-white/80 bg-white/80 px-4 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                        >
                          <span className="text-sm text-slate-400">{item.label}</span>{" "}
                          <span className="text-sm font-semibold text-slate-950">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {headerActions ? (
                  <div className="relative flex flex-wrap items-center gap-3">
                    {headerActions}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {children}
        </main>
      </div>
    </PageTransition>
  );
}
