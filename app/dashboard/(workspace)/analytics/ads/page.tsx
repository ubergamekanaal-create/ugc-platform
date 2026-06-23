import { redirect } from "next/navigation";
import { BrandAnalyticsContent } from "@/components/dashboard/brand-analytics-content";
import { BrandWorkspace } from "@/components/dashboard/brand-workspace";
import { getDashboardContext } from "@/lib/data/platform";

export const dynamic = "force-dynamic";

export default async function BrandAnalyticsAdsPage() {
  const context = await getDashboardContext("analytics");

  if (!context) {
    redirect("/login");
  }

  if (context.role !== "brand") {
    redirect("/dashboard");
  }

  return (
    <BrandWorkspace
      profile={context.profile}
      data={context.data}
      section="analytics"
      renderMode="content"
      detailView={{
        title: "Analytics / Ads",
        description:
          "Review funding progress, payout delivery, and campaign-level performance without leaving the analytics workspace.",
        content: <BrandAnalyticsContent data={context.data} view="ads" />,
      }}
    />
  );
}
