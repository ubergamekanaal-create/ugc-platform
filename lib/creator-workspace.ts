export const creatorWorkspaceSections = [
  {
    slug: "home",
    label: "Home",
    description: "Browse active campaigns and manage your creator pipeline.",
  },
  {
    slug: "my-brands",
    label: "My Brands",
    description: "Keep track of the brands and briefs you are working with.",
  },
  {
    slug: "chat",
    label: "Chat",
    description: "Keep your brand conversations in one place.",
  },
  {
    slug: "payouts",
    label: "Payouts",
    description: "Connect Stripe and track pending or accepted earnings.",
  },
  {
    slug: "profile",
    label: "Profile",
    description: "Manage your profile and account preferences.",
  },
] as const;

export type CreatorWorkspaceSection =
  (typeof creatorWorkspaceSections)[number]["slug"];

export const creatorWorkspaceSectionAliases: Record<
  string,
  CreatorWorkspaceSection
> = {
  dashboard: "home",
  settings: "profile",
  mybrands: "my-brands",
};

export function isCreatorWorkspaceSection(
  value: string,
): value is CreatorWorkspaceSection {
  return creatorWorkspaceSections.some((section) => section.slug === value);
}

export function getCreatorWorkspaceHref(section: CreatorWorkspaceSection) {
  return section === "home" ? "/dashboard" : `/dashboard/${section}`;
}
