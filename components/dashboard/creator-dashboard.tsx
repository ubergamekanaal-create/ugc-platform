import { CreatorWorkspace } from "@/components/dashboard/creator-workspace";
import type { CreatorDashboardData, UserProfile } from "@/lib/types";

type CreatorDashboardProps = {
  profile: UserProfile & { role: "creator" };
  data: CreatorDashboardData;
};

export function CreatorDashboard({ profile, data }: CreatorDashboardProps) {
  return <CreatorWorkspace profile={profile} data={data} section="home" />;
}
