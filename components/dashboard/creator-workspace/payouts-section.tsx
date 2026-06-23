import { CreatorPayoutsPanel } from "@/components/dashboard/creator-payouts-panel";
import type { CreatorWorkspaceSectionContext } from "./types";

export function CreatorWorkspacePayoutsSection({ ctx }: { ctx: CreatorWorkspaceSectionContext }) {
  const {
    profile,
    data,
  } = ctx;
    return <CreatorPayoutsPanel profile={profile} payouts={data.payouts} />;
  }