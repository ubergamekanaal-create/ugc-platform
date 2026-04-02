import { notFound, redirect } from "next/navigation";
import { BrandCampaignEditorScreen } from "@/components/dashboard/brand-campaign-editor-screen";
import { getDashboardContext } from "@/lib/data/platform";

export const dynamic = "force-dynamic";

type EditBrandCampaignPageProps = {
  params: Promise<{
    campaignId: string;
  }>;
};

export default async function EditBrandCampaignPage({
  params,
}: EditBrandCampaignPageProps) {
  const [{ campaignId }, context] = await Promise.all([
    params,
    getDashboardContext("creators"),
  ]);

  if (!context) {
    redirect("/login");
  }

  if (context.role !== "brand") {
    redirect("/dashboard");
  }

  const campaign =
    context.data.campaigns.find((item) => item.id === campaignId) ?? null;

  if (!campaign) {
    notFound();
  }

  return (
    <BrandCampaignEditorScreen
      profile={context.profile}
      data={context.data}
      campaign={campaign}
      renderMode="content"
    />
  );
}
