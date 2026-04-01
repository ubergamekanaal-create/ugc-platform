"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { BrandWorkspaceChrome } from "@/components/dashboard/brand-workspace";
import { CreatorWorkspaceChrome } from "@/components/dashboard/creator-workspace";
import { isBrandWorkspaceSection } from "@/lib/brand-workspace";
import { isCreatorWorkspaceSection } from "@/lib/creator-workspace";
import type {
  BrandDashboardData,
  CreatorDashboardData,
  UserProfile,
} from "@/lib/types";

type DashboardWorkspaceLayoutProps =
  | {
      role: "brand";
      profile: UserProfile & { role: "brand" };
      data: BrandDashboardData;
      children: ReactNode;
    }
  | {
      role: "creator";
      profile: UserProfile & { role: "creator" };
      data: CreatorDashboardData;
      children: ReactNode;
    };

export function DashboardWorkspaceLayout(props: DashboardWorkspaceLayoutProps) {
  const segment = useSelectedLayoutSegment();

  if (props.role === "brand") {
    const section =
      segment && isBrandWorkspaceSection(segment) ? segment : "dashboard";

    return (
      <BrandWorkspaceChrome
        profile={props.profile}
        data={props.data}
        section={section}
      >
        {props.children}
      </BrandWorkspaceChrome>
    );
  }

  const section =
    segment && isCreatorWorkspaceSection(segment) ? segment : "home";

  return (
    <CreatorWorkspaceChrome
      profile={props.profile}
      data={props.data}
      section={section}
    >
      {props.children}
    </CreatorWorkspaceChrome>
  );
}
