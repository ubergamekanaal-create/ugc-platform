export const brandWorkspaceSections = [
  {
    slug: "dashboard",
    label: "Dashboard",
    group: "primary",
    description: "Manage creators, campaigns, and content from one place.",
  },
  {
    slug: "submissions",
    label: "Submissions",
    group: "primary",
    description: "Review pitches, shortlist talent, and keep approvals moving.",
  },
  {
    slug: "chat",
    label: "Chat",
    group: "primary",
    description: "Keep creator conversations close to campaign activity.",
  },
  {
    slug: "ads",
    label: "Ads",
    group: "primary",
    description: "Track the paid media rollouts tied to creator content.",
  },
  {
    slug: "analytics",
    label: "Analytics",
    group: "primary",
    description: "Watch campaign pacing, creator ROI, and funnel health.",
  },
  {
    slug: "creators",
    label: "Creators",
    group: "primary",
    description: "Build a roster of high-fit creators for repeat programs.",
  },
  {
    slug: "finance",
    label: "Finance",
    group: "primary",
    description: "Manage committed spend, payouts, and budget top-ups.",
  },
  {
    slug: "integrations",
    label: "Integrations",
    group: "configuration",
    description: "Connect commerce, ads, and messaging tools into CIRCL.",
  },
  {
    slug: "settings",
    label: "Settings",
    group: "configuration",
    description: "Update your workspace details, notifications, and billing.",
  },
] as const;

export type BrandWorkspaceSection = (typeof brandWorkspaceSections)[number]["slug"];

export const brandWorkspaceSectionAliases: Record<string, BrandWorkspaceSection> =
  {
    analyatics: "analytics",
    intigrations: "integrations",
  };

export function isBrandWorkspaceSection(
  value: string,
): value is BrandWorkspaceSection {
  return brandWorkspaceSections.some((section) => section.slug === value);
}

export function getBrandWorkspaceHref(section: BrandWorkspaceSection) {
  return section === "dashboard" ? "/dashboard" : `/dashboard/${section}`;
}
