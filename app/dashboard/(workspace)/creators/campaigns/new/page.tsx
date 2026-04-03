import { redirect } from "next/navigation";
import { BrandCampaignEditorScreen } from "@/components/dashboard/brand-campaign-editor-screen";
import { getDashboardContext } from "@/lib/data/platform";

export const dynamic = "force-dynamic";

export default async function NewBrandCampaignPage() {
  const context = await getDashboardContext("creators");

  if (!context) {
    redirect("/login");
  }

  if (context.role !== "brand") {
    redirect("/dashboard");
  }

  return (
    <BrandCampaignEditorScreen
      profile={context.profile}
      data={context.data}
      renderMode="content"
    />
  );
}
