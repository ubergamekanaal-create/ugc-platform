import { redirect } from "next/navigation";
import { BrandWorkspace } from "@/components/dashboard/brand-workspace";
import { CreatorWorkspace } from "@/components/dashboard/creator-workspace";
import { getDashboardContext } from "@/lib/data/platform";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await getDashboardContext();

  if (!context) {
    redirect("/login");
  }

  if (context.role === "brand") {
    return (
      <BrandWorkspace
        profile={context.profile}
        data={context.data}
        section="dashboard"
        renderMode="content"
      />
    );
  }

  return (
    <CreatorWorkspace
      profile={context.profile}
      data={context.data}
      section="home"
      renderMode="content"
    />
  );
}
