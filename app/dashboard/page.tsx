import { redirect } from "next/navigation";
import { BrandDashboard } from "@/components/dashboard/brand-dashboard";
import { CreatorDashboard } from "@/components/dashboard/creator-dashboard";
import { getDashboardContext } from "@/lib/data/platform";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await getDashboardContext();
  
  if (!context) {
    redirect("/login");
  }

  if (context.role === "brand") {
    return <BrandDashboard profile={context.profile} data={context.data} />;
  }

  return <CreatorDashboard profile={context.profile} data={context.data} />;
}
