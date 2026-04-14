"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { PageTransition } from "@/components/shared/motion";
import { cn } from "@/lib/utils";
import Header from "../shared/header";
import { UserProfile } from "@/lib/types";
import { createPortal } from "react-dom";
// import Header from "../shared/header";

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

type WorkspaceSidebarProps = {
  tone: WorkspaceShellTone;
  displayName: string;
  roleLabel: string;
  initials: string;
  navGroups: WorkspaceNavGroup[];
  sidebarFooter?: ReactNode;
};

type WorkspaceMainContentProps = {
  tone: WorkspaceShellTone;
  eyebrow: string;
  title: string;
  description: string;
  metaItems?: Array<{ label: string; value: string }>;
  topBanner?: ReactNode;
  headerActions?: ReactNode;
  showTopBanner?: boolean;
  showHeroSection?: boolean;
  animated?: boolean;
  children: ReactNode;
};

type WorkspaceViewportProps = {
  tone: WorkspaceShellTone;
  children: ReactNode;
  name?: string | null;
  roleLabel: string;
  profile?: UserProfile & { role: "brand" };
  navGroups: WorkspaceNavGroup[];
};

type WorkspaceShellProps = WorkspaceSidebarProps &
  WorkspaceMainContentProps;

type Props = {
  name?: string;
  roleLabel?: string;
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
      "bg-white",
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
      "bg-white",
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
        "relative rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(7,107,210,0.42),transparent)]" />
      {children}
    </div>
  );
}
export default function BottomNav({
  navGroups,
  tone
}: {
  navGroups: WorkspaceNavGroup[],
  tone: "brand" | "creator"
}) {
  const [active, setActive] = useState("home");
  const [isOpen, setIsOpen] = useState(false);
  const brandRoutes = [
    "/dashboard",
    "/dashboard/submissions",
    "/dashboard/creators",
    "/dashboard/analytics",
  ];

  const creatorRoutes = [
    "/dashboard",
    "/dashboard/my-brands",
    "/dashboard/payouts",
    "/dashboard/profile",
  ];
  const routes = (tone === "brand") ? brandRoutes : creatorRoutes;
  const navItems = [
    {
      id: "home",
      href: routes[0],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-house sm:h-7 h-5 sm:w-7 w-5 transition-all duration-200 scale-110" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
      ),
    },
    {
      id: "box",
      href: routes[1],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-inbox sm:h-7 h-5 sm:w-7 w-5 transition-all duration-200" aria-hidden="true"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
      ),
    },
    {
      id: "users",
      href: routes[2],
      icon: (
        tone === "brand" ? (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-users sm:h-7 h-5 sm:w-7 w-5 transition-all duration-200" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg>) : (<svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 3V21M15.679 6.63439C14.063 4.2691 7.94541 4.02196 7.94541 8.16745C7.94541 12.3129 16.7524 10.33 16.2439 15.2118C15.8199 19.2823 9.19299 19.3384 7.21094 16.0891" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>)
        // <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 3V21M15.679 6.63439C14.063 4.2691 7.94541 4.02196 7.94541 8.16745C7.94541 12.3129 16.7524 10.33 16.2439 15.2118C15.8199 19.2823 9.19299 19.3384 7.21094 16.0891" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
        // <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-users sm:h-7 h-5 sm:w-7 w-5 transition-all duration-200" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg>
      ),
    },
    {
      id: "analytics",
      href: routes[3],
      icon: (
        tone === "brand" ? (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chart-column sm:h-7 h-5 sm:w-7 w-5 transition-all duration-200" aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>
        ) : (
          <svg viewBox="0 0 23 23" version="1.1" width="23" height="23" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>profile [#1336]</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-380.000000, -2159.000000)" fill="currentColor"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M334,2011 C337.785,2011 340.958,2013.214 341.784,2017 L326.216,2017 C327.042,2013.214 330.215,2011 334,2011 M330,2005 C330,2002.794 331.794,2001 334,2001 C336.206,2001 338,2002.794 338,2005 C338,2007.206 336.206,2009 334,2009 C331.794,2009 330,2007.206 330,2005 M337.758,2009.673 C339.124,2008.574 340,2006.89 340,2005 C340,2001.686 337.314,1999 334,1999 C330.686,1999 328,2001.686 328,2005 C328,2006.89 328.876,2008.574 330.242,2009.673 C326.583,2011.048 324,2014.445 324,2019 L344,2019 C344,2014.445 341.417,2011.048 337.758,2009.673" id="profile-[#1336]"> </path> </g> </g> </g> </g></svg>
        )
      ),
    },
  ];

  return (
    <div className="block md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
      {/* NAV PIL */}
      <div className="flex items-center gap-6 px-6 py-1 rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-200">
        {navItems?.map((item) => {
          const isActive = active === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActive(item.id)}
              className={`flex items-center justify-center h-10 w-10 rounded-full transition-all duration-200
                ${isActive
                  ? "bg-blue-100 text-blue-600 shadow-inner"
                  : "text-gray-500 hover:text-black"
                }
              `}
            >
              <div>{item.icon}</div>
            </Link>
          );
        })}
      </div>

      {/* MENU BUTTON */}
      <button onClick={() => setIsOpen(true)} className="h-12 w-12 flex items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-gray-200">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-menu h-7 w-7" aria-hidden="true"><path d="M4 12h16"></path><path d="M4 18h16"></path><path d="M4 6h16"></path></svg>
      </button>
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-md">

          {/* CLICK OUTSIDE CLOSE */}
          <div
            className="absolute inset-0"
            onClick={() => setIsOpen(false)}
          />

          {/* MODAL */}
          <div className="z-[9999]  absolute w-full max-w-sm mx-auto mb-6 rounded-[28px] bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-slideUp">

            <nav className="space-y-2 max-h-[70vh] overflow-y-auto">
              {navGroups.map((group) => (
                <div key={group.label ?? "primary"}>

                  {group.label && (
                    <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {group.label}
                    </p>
                  )}

                  <div className="mt-2 space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition
                  ${item.active
                            ? "bg-blue-100 text-blue-600"
                            : "text-slate-700 hover:bg-gray-100"
                          }
                `}
                      >
                        <span className="h-5 w-5">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
export function WorkspaceViewport({
  tone,
  children,
  name,
  roleLabel,
  profile,
  navGroups,
}: WorkspaceViewportProps) {
  const theme = toneClasses[tone];
  return (
    <div className={cn("relative text-slate-950 bg-[#f1f2f4]", theme.shell)}>
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(148,163,184,0.14)_1px,transparent_1px)] [background-size:22px_22px]" />
      <Header tone={tone} name={name} roleLabel={roleLabel} profile={profile} />

      <div className="relative h-full grid  gap-4 p-4 md:grid-cols-[300px_minmax(0,1fr)] md:p-0">
        {children}
      </div>
      <BottomNav navGroups={navGroups} tone={tone} />
    </div>
  );
}





export function WorkspaceSidebar({
  tone,
  displayName,
  roleLabel,
  initials,
  navGroups,
  sidebarFooter,
}: WorkspaceSidebarProps) {
  const theme = toneClasses[tone];

  return (
    <aside className="hidden md:block flex-1 z-200 md:sticky md:top-[75px] h-fit md:h-auto md:max-h-[calc(100vh-76px)] md:overflow-y-auto overflow-x-hidden border-r border-r-slate-300 bg-[#f1f2f4] py-5">
      {/* <div className="flex items-start justify-between pb-6 border-b border-b-white/80">
        <BrandMark tone="light" />
        <span
          className={cn(
            "flex items-center justify-center rounded-full border px-2 py-1 text-[11px] font-semibold capitalize",
            theme.pill,
          )}
        >
          {roleLabel}
        </span>
      </div> */}
      <div className="px-4 mb-4">
        <div className="border-b border-b-slate-200">
          <div
            className={cn(
              "relative overflow-hidden rounded-3xl px-3 py-3 mb-6 text-black bg-white", // Slightly smaller radius
              "border border-slate-200 bg-slate-950",
              // theme.avatar,
            )}

          >
            <div className="absolute -right-10 -top-10 h-32 w-32 bg-blue-500/10 blur-3xl" />
            <div className="flex justify-between items-center justify-center">
              <div className="relative flex items-center gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black text-white text-sm font-semibold backdrop-blur-md">
                  {initials}
                </span>

                <div className="min-w-0">
                  <p className="text-[16px] font-semibold tracking-tight leading-tight">
                    {displayName}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-600 font-medium leading-snug">
                    Everything operational <br /> lives here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav className="mt-6 space-y-3">
          {navGroups.map((group) => (
            <div key={group.label ?? "primary"}>
              {group.label ? (
                <p className="px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {group.label}
                </p>
              ) : null}
              <div className={cn("space-y-1", group.label ? "mt-3" : "")}>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                      "group flex items-center justify-between rounded-[1.35rem] border px-1 py-1 transition",
                      item.active
                        ? "border-[rgba(7,107,210,0.16)] bg-[rgba(7,107,210,0.08)] text-accent shadow-[0_14px_30px_rgba(7,107,210,0.12)]"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white/58 hover:text-slate-950",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-[1rem] transition",
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
      </div>

      {sidebarFooter ? <div className="mt-8 lg:mt-0 ">{sidebarFooter}</div> : null}
    </aside>
  );
}

export function WorkspaceMainContent({
  tone,
  eyebrow,
  title,
  description,
  metaItems,
  topBanner,
  headerActions,
  showTopBanner = false,
  showHeroSection = true,
  animated = true,
  children,
}: WorkspaceMainContentProps) {
  const theme = toneClasses[tone];
  const content = (
    <main className="min-w-0 max-w-[1720px] mx-auto pt-[88px] md:pt-[94px] space-y-4 md:py-4 md:pr-4">
      {showTopBanner ? topBanner : null}

      {/* {showHeroSection ? (
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.88),_rgba(244,248,255,0.9))] px-6 py-6 shadow-[0_28px_90px_rgba(15,23,42,0.09)] sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(7,107,210,0.5),transparent)]" />
          <div className={cn("pointer-events-none absolute -right-16 -top-16 h-48 w-48", theme.heroAccent)} />

          <div className=" flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                {eyebrow}
              </p>
              <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
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
              <div className="flex flex-wrap items-center gap-3">
                {headerActions}
              </div>
            ) : null}
          </div>
        </section>
      ) : null} */}

      {children}
    </main>
  );

  if (!animated) {
    return content;
  }

  return <PageTransition className="min-w-0">{content}</PageTransition>;
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

  return (
    <PageTransition>
      <WorkspaceViewport
        tone={tone}
        name={displayName}
        roleLabel={roleLabel}
        navGroups={navGroups}
      >
        <WorkspaceSidebar
          tone={tone}
          displayName={displayName}
          roleLabel={roleLabel}
          initials={initials}
          navGroups={navGroups}
          sidebarFooter={sidebarFooter}
        />
        <WorkspaceMainContent
          tone={tone}
          eyebrow={eyebrow}
          title={title}
          description={description}
          metaItems={metaItems}
          topBanner={topBanner}
          headerActions={headerActions}
          showTopBanner={showTopBanner}
          showHeroSection={showHeroSection}
          animated={false}
        >
          {children}
        </WorkspaceMainContent>
      </WorkspaceViewport>
    </PageTransition>
  );
}
