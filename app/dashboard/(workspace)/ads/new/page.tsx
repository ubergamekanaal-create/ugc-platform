import { redirect } from "next/navigation";
import { BrandMetaAdBuilderScreen } from "@/components/dashboard/brand-meta-ad-builder-screen";
import { getDashboardContext } from "@/lib/data/platform";

export const dynamic = "force-dynamic";

export default async function NewBrandAdSetPage() {
  const context = await getDashboardContext("ads");

  if (!context) {
    redirect("/login");
  }

  if (context.role !== "brand") {
    redirect("/dashboard");
  }

  return (
    <BrandMetaAdBuilderScreen
      profile={context.profile}
      data={context.data}
      renderMode="content"
    />
  );
}
