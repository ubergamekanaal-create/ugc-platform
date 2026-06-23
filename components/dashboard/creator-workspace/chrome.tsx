import Link from "next/link";
import Header from "@/components/shared/header";
import {
  WorkspaceSidebar,
  WorkspaceViewport,
  type WorkspaceNavGroup,
} from "@/components/dashboard/workspace-shell";
import {
  creatorWorkspaceSections,
  getCreatorWorkspaceHref,
} from "@/lib/creator-workspace";
import { getDisplayName, getInitials } from "@/lib/utils";
import { sectionIcons } from "./icons";
import type { CreatorWorkspaceChromeProps } from "./types";
export function CreatorWorkspaceChrome({
  profile,
  data,
  section,
  children,
}: CreatorWorkspaceChromeProps) {
  const pendingInvitations = data.invitations.filter(
    (invitation) => invitation.status === "pending",
  );
  const navGroups: WorkspaceNavGroup[] = [
    {
      items: creatorWorkspaceSections.map((item) => {
        const Icon = sectionIcons[item.slug];
        return {
          href: getCreatorWorkspaceHref(item.slug),
          label: item.label,
          active: item.slug === section,
          icon: <Icon className="h-5 w-5" />,
          badge:
            item.slug === "my-brands" && pendingInvitations.length > 0
              ? String(pendingInvitations.length)
              : null,
        };
      }),
    },
  ];
  const displayName = getDisplayName(profile.full_name, "Creator");
  const userName = profile?.full_name;
  const sidebarFooter = (
    <div className="mx-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Next move
        </p>
        <p className="mt-2 text-sm font-semibold leading-5 text-slate-950">
          {data.profile_assets.length > 0
            ? `${data.profile_assets.length} samples live`
            : "Upload portfolio proof"}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Keep your proof fresh for brand reviews.
        </p>
        <Link
          href="/dashboard/profile"
          className="mt-3 inline-flex h-8 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#076BD2,_#3B82F6)] px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          Open profile
        </Link>
      </div>
    </div>
  );
  return (
    <WorkspaceViewport
      tone="creator"
      name={userName}
      roleLabel="Creator studio"
      navGroups={navGroups}
    >
      <WorkspaceSidebar
        tone="creator"
        displayName={displayName}
        roleLabel="Creator studio"
        initials={getInitials(displayName)}
        navGroups={navGroups}
        sidebarFooter={sidebarFooter}
      />
      <div className="min-w-0">
        <Header
          tone="creator"
          name={userName}
          roleLabel="Creator studio"
          profile={profile}
        />
        {children}
      </div>
    </WorkspaceViewport>
  );
}