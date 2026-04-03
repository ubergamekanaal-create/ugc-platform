import { notFound, redirect } from "next/navigation";
import { BrandWorkspace } from "@/components/dashboard/brand-workspace";
import { CreatorWorkspace } from "@/components/dashboard/creator-workspace";
import {
  brandWorkspaceSectionAliases,
  isBrandWorkspaceSection,
} from "@/lib/brand-workspace";
import {
  creatorWorkspaceSectionAliases,
  isCreatorWorkspaceSection,
} from "@/lib/creator-workspace";
import { getDashboardContext } from "@/lib/data/platform";

export const dynamic = "force-dynamic";

type DashboardSectionPageProps = {
  params: Promise<{
    section: string;
  }>;
};

export default async function DashboardSectionPage({
  params,
}: DashboardSectionPageProps) {
  const { section } = await params;
  const context = await getDashboardContext(section);

  if (!context) {
    redirect("/login");
  }

  if (context.role === "brand") {
    const alias = brandWorkspaceSectionAliases[section];

    if (alias) {
      redirect(alias === "dashboard" ? "/dashboard" : `/dashboard/${alias}`);
    }

    if (!isBrandWorkspaceSection(section)) {
      notFound();
    }

    return (
      <BrandWorkspace
        profile={context.profile}
        data={context.data}
        section={section}
        renderMode="content"
      />
    );
  }

  const alias = creatorWorkspaceSectionAliases[section];

  if (alias) {
    redirect(alias === "home" ? "/dashboard" : `/dashboard/${alias}`);
  }

  if (!isCreatorWorkspaceSection(section)) {
    notFound();
  }

  return (
    <CreatorWorkspace
      profile={context.profile}
      data={context.data}
      section={section}
      renderMode="content"
    />
  );
}
