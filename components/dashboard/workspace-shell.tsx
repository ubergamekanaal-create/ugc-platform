"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/shared/brand-mark";
import { PageTransition } from "@/components/shared/motion";
import { cn } from "@/lib/utils";
import Header from "../shared/header";
import { UserProfile } from "@/lib/types";
import { createPortal } from "react-dom";
import { useClickOutside } from "@/hooks/useClickOutside";
// import Header from "../shared/header";

export type WorkspaceShellTone = "brand" | "creator";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  badge?: string | null;

  children?: {
    href: string;
    label: string;
    active?: boolean;
  }[];
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
  brands?: any[];
  name?: string | null;
  profile?: UserProfile & { role: "brand" };
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
  WorkspaceMainContentProps & {
    brands?: any[];
  };;

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
  const pathname = usePathname();
  const [active, setActive] = useState("home");
  const [isOpen, setIsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
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
  useEffect(() => {
    const activeNestedItem = navGroups
      .flatMap((group) => group.items)
      .find((item) =>
        item.children?.some((child) =>
          pathname === child.href || pathname.startsWith(`${child.href}/`),
        ),
      );

    setOpenMenu(activeNestedItem?.href ?? null);
  }, [navGroups, pathname]);

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
                    {group.items.map((item) => {
                      const hasChildren = Boolean(item.children?.length);
                      const isExpanded = openMenu === item.href;

                      return (
                        <div key={item.href}>
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenu((current) =>
                                  current === item.href ? null : item.href,
                                )
                              }
                              aria-expanded={isExpanded}
                              className={`flex w-full items-center justify-between gap-3 px-3 py-3 rounded-xl transition
                                ${item.active
                                  ? "bg-blue-100 text-blue-600"
                                  : "text-slate-700 hover:bg-gray-100"
                                }
                              `}
                            >
                              <span className="flex items-center gap-3">
                                <span className="h-5 w-5">{item.icon}</span>
                                <span className="text-sm font-medium">{item.label}</span>
                              </span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={cn(
                                  "transition-transform duration-200",
                                  isExpanded && "rotate-180",
                                )}
                              >
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </button>
                          ) : (
                            <Link
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
                          )}

                          {hasChildren && isExpanded ? (
                            <div className="mt-1 space-y-1 pl-8">
                              {item.children!.map((child) => {
                                const childActive =
                                  child.active ||
                                  pathname === child.href ||
                                  pathname.startsWith(`${child.href}/`);

                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    aria-current={childActive ? "page" : undefined}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                      "block rounded-xl px-3 py-2 text-sm font-medium transition",
                                      childActive
                                        ? "bg-blue-100 text-blue-600"
                                        : "text-slate-600 hover:bg-gray-100 hover:text-slate-950",
                                    )}
                                  >
                                    {child.label}
                                  </Link>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
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
      {/* <Header tone={tone} name={name} roleLabel={roleLabel} profile={profile} /> */}

      <div className="relative h-full grid md:grid-cols-[250px_minmax(0,1fr)] md:p-0">
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
  brands = [],
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const [selectedWorkspaceId,
    setSelectedWorkspaceId] =
    useState<string | null>(null);
  // const [brands, setBrands] = useState([]);
  const [isWorkspaceOpen,
    setIsWorkspaceOpen] =
    useState(false);
  const [openMenu, setOpenMenu] =
    useState<string | null>(null);
  const workspaceDropdownRef =
    useRef<HTMLDivElement | null>(null);

  useClickOutside(
    workspaceDropdownRef,
    () => {
      setIsWorkspaceOpen(false);
    }
  );
  useEffect(() => {

    const storedWorkspaceId =
      localStorage.getItem(
        "last-selected-org-id"
      );

    if (storedWorkspaceId) {

      setSelectedWorkspaceId(
        storedWorkspaceId
      );

      return;
    }

    if (brands.length > 0) {

      localStorage.setItem(
        "last-selected-org-id",
        brands[0].workspace_id
      );

      setSelectedWorkspaceId(
        brands[0].workspace_id
      );
    }

  }, [brands]);
  useEffect(() => {
    const activeNestedItem = navGroups
      .flatMap((group) => group.items)
      .find((item) =>
        item.children?.some((child) =>
          pathname === child.href || pathname.startsWith(`${child.href}/`),
        ),
      );

    if (activeNestedItem) {
      setOpenMenu(activeNestedItem.href);
      return;
    }

    setOpenMenu(null);
  }, [navGroups, pathname]);
  const currentBrand =
    brands.find(
      (b) =>
        b.workspace_id ===
        selectedWorkspaceId
    ) || brands[0];
  const handleWorkspaceSwitch = (
    workspaceId: string
  ) => {

    localStorage.setItem(
      "last-selected-org-id",
      workspaceId
    );

    setSelectedWorkspaceId(
      workspaceId
    );

    setIsWorkspaceOpen(false);

    window.location.reload();
  };
  const isBrandsLoading =
    brands.length === 0;
  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:max-h-screen md:flex-col overflow-x-hidden border-r border-r-slate-300 bg-white pt-3 pb-5">
      <div className="flex items-start justify-start px-4 pb-2">
        <BrandMark tone="light" />
      </div>
      <div className="mb-4 flex-1 overflow-y-auto px-4 pt-4">
        {tone === "creator" && <div>
          <div
            className={cn(
              "relative overflow-hidden rounded-3xl px-2 py-2 mb-6 text-black bg-white", // Slightly smaller radius
              "border border-slate-200",
              // theme.avatar,
            )}

          >
            {/* <div className="absolute -right-10 -top-10 h-32 w-32 bg-blue-500/10 blur-3xl" /> */}
            <div className="flex justify-between items-center justify-center">
              <div className="relative flex items-center gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black text-white text-sm font-semibold backdrop-blur-md">
                  {initials}
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-tight leading-tight">
                    {displayName}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-600 font-medium leading-snug">
                    Creator
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>}

        {tone === "brand" && (
          <div className="mb-6 relative" ref={workspaceDropdownRef}>

            <button
              onClick={() => {

                if (isBrandsLoading) return;

                setIsWorkspaceOpen(
                  !isWorkspaceOpen
                );
              }}
              className={cn(
                "w-full rounded-3xl border border-slate-200 bg-white px-2 py-2 shadow-sm transition hover:border-slate-300",
                isBrandsLoading &&
                "cursor-default"
              )}
            >

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  {isBrandsLoading ? (
                    <>
                      <div className="h-11 w-11 rounded-full bg-slate-200 animate-pulse" />

                      <div className="space-y-2">
                        <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />

                        <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">

                        {currentBrand?.brand?.full_name
                          ?.charAt(0)
                          ?.toUpperCase()}

                      </div>

                      <div className="text-left">

                        <p className="text-sm font-semibold text-slate-900">
                          {currentBrand?.brand
                            ?.full_name}
                        </p>

                        <p className="text-xs text-slate-500 capitalize">
                          {currentBrand?.role}
                        </p>

                      </div>
                    </>
                  )}
                </div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "transition-transform duration-200",
                    isWorkspaceOpen &&
                    "rotate-180"
                  )}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>

              </div>
            </button>

            {isWorkspaceOpen && (
              <div className="absolute left-0 right-0 z-50 mt-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">

                <div className="space-y-1">

                  {brands.map((item) => {

                    const isSelected =
                      item.workspace_id ===
                      selectedWorkspaceId;

                    return (
                      <button
                        key={
                          item.workspace_id
                        }
                        onClick={() =>
                          handleWorkspaceSwitch(
                            item.workspace_id
                          )
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl px-3 py-3 transition",
                          isSelected
                            ? "bg-slate-100"
                            : "hover:bg-slate-50"
                        )}
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">

                            {item.brand?.full_name
                              ?.charAt(0)
                              ?.toUpperCase()}

                          </div>

                          <div className="text-left">

                            <p className="text-sm font-semibold text-slate-900">
                              {item.brand
                                ?.full_name}
                            </p>

                            <p className="text-xs text-slate-500 capitalize">
                              Team • {item.role}
                            </p>

                          </div>
                        </div>

                        {isSelected && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-slate-700"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        <nav className="mt-6 space-y-3">

          {navGroups.map((group) => (
            <div key={group.label ?? "primary"}>
              {group.label ? (
                <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {group.label}
                </p>
              ) : null}
              <div className={cn("space-y-1", group.label ? "mt-3" : "")}>
                {group.items.map((item) => (
                  <div key={item.href}>
                    {item.children?.length ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenu((current) =>
                            current === item.href ? null : item.href,
                          )
                        }
                        aria-expanded={openMenu === item.href}
                        className={cn(
                          "group flex w-full items-center justify-between rounded-[1.35rem] border px-1 py-1 transition",
                          item.active
                            ? "border-[rgba(7,107,210,0.16)] bg-[rgba(7,107,210,0.08)] text-accent"
                            : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white/58 hover:text-slate-950",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center transition",
                              item.active
                                ? ""
                                : "text-slate-700 group-hover:text-[color:#076BD2]",
                            )}
                          >
                            {item.icon}
                          </span>
                          <span
                            className={cn(
                              "text-[14px] font-medium group-hover:text-[color:#076BD2]",
                              item.active && "text-[#076BD2]",
                            )}
                          >
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.badge ? (
                            <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-500">
                              {item.badge}
                            </span>
                          ) : null}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={cn(
                              "transition-transform duration-200",
                              openMenu === item.href && "rotate-180",
                            )}
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        aria-current={item.active ? "page" : undefined}
                        className={cn(
                          "group flex items-center justify-between rounded-[1.35rem] border px-1 py-1 transition",
                          item.active
                            // ? "border-[rgba(7,107,210,0.16)] bg-[rgba(7,107,210,0.08)] text-accent"
                            ? "border-slate-100 bg-[rgba(7,107,210,0.08)] text-accent"
                            : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white/58 hover:text-slate-950",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center transition",
                              item.active
                                ? " "
                                : " text-slate-700 group-hover:text-[color:#076BD2]",
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className={cn("text-[14px] font-medium group-hover:text-[color:#076BD2]", item.active && "text-[#076BD2]")}>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-500">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    )}

                    {item.children?.length && openMenu === item.href ? (
                      <div className="mt-2 space-y-1 pl-4">
                        {item.children.map((child) => {
                          const childActive =
                            child.active ||
                            pathname === child.href ||
                            pathname.startsWith(`${child.href}/`);

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              aria-current={childActive ? "page" : undefined}
                              className={cn(
                                "block rounded-[1.1rem] border px-2 py-1 text-sm font-medium transition",
                                childActive
                                  ? "border-[rgba(7,107,210,0.16)] bg-[rgba(7,107,210,0.08)] text-[#076BD2]"
                                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white/58 hover:text-slate-950",
                              )}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {sidebarFooter ? <div className="mt-auto">{sidebarFooter}</div> : null}
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
    <main className="min-w-0 px-4 max-w-[1720px] mx-auto pt-[20px] md:pt-[20px] space-y-4 md:py-4 md:pr-4 min-h-[calc(100vh-63px)]">
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
  brands = [],
  showTopBanner = true,
  showHeroSection = true,
  children,
  name,
  profile,
}: WorkspaceShellProps) {

  return (
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
        brands={brands}
      />
      <div>
        <Header tone={tone} name={name} roleLabel={roleLabel} profile={profile} />
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
          animated={true}
        >
          {children}
        </WorkspaceMainContent>
      </div>

    </WorkspaceViewport>
  );
}
