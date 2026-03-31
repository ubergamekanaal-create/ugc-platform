import { BrandWorkspace } from "@/components/dashboard/brand-workspace";
import type { BrandDashboardData, UserProfile } from "@/lib/types";

type BrandDashboardProps = {
  profile: UserProfile & { role: "brand" };
  data: BrandDashboardData;
};

export function BrandDashboard({ profile, data }: BrandDashboardProps) {
  return <BrandWorkspace profile={profile} data={data} section="dashboard" />;
}
