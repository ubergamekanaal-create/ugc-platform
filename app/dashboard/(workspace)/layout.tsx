import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardWorkspaceLayout } from "@/components/dashboard/dashboard-workspace-layout";
import { getDashboardContext } from "@/lib/data/platform";

export const dynamic = "force-dynamic";

type DashboardWorkspaceGroupLayoutProps = {
  children: ReactNode;
};

export default async function DashboardWorkspaceGroupLayout({
  children,
}: DashboardWorkspaceGroupLayoutProps) {
  const context = await getDashboardContext();

  if (!context) {
    redirect("/login");
  }

  if (context.role === "brand") {
    return (
      <DashboardWorkspaceLayout
        role="brand"
        profile={context.profile}
        data={context.data}
      >
        {children}
      </DashboardWorkspaceLayout>
    );
  }

  return (
    <DashboardWorkspaceLayout
      role="creator"
      profile={context.profile}
      data={context.data}
    >
      {children}
    </DashboardWorkspaceLayout>
  );
}
