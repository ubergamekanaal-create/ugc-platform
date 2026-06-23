import type { ReactNode } from "react";
import { WorkspacePanel } from "@/components/dashboard/workspace-shell";

export function SectionPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <WorkspacePanel className={className}>{children}</WorkspacePanel>;
}

