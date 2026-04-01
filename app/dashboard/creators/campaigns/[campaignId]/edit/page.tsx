import { notFound, redirect } from "next/navigation";
import { BrandCampaignEditorScreen } from "@/components/dashboard/brand-campaign-editor-screen";
import { getDashboardContext } from "@/lib/data/platform";

export const dynamic = "force-dynamic";

type EditBrandCampaignPageProps = {
  params: {
    campaignId: string;
  };
};

export default async function EditBrandCampaignPage({
  params,
}: EditBrandCampaignPageProps) {
  const context = await getDashboardContext();

  if (!context) {
    redirect("/login");
  }

  if (context.role !== "brand") {
    redirect("/dashboard");
  }

  const campaign =
    context.data.campaigns.find((item) => item.id === params.campaignId) ?? null;

  if (!campaign) {
    notFound();
  }

  return (
    <BrandCampaignEditorScreen
      profile={context.profile}
      data={context.data}
      campaign={campaign}
    />
  );
}
