import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import type { CreatorWorkspaceSection } from "@/lib/creator-workspace";
import type { CreatorDashboardData, CreatorPortfolioAsset, UserProfile } from "@/lib/types";
import type { buildCreatorChatCandidates } from "@/lib/chat/candidates";

export type CreatorWorkspaceProps = {
  profile: UserProfile & { role: "creator" };
  data: CreatorDashboardData;
  section: CreatorWorkspaceSection;
  renderMode?: "full" | "content";
};

export type CreatorWorkspaceChromeProps = {
  profile: UserProfile & { role: "creator" };
  data: CreatorDashboardData;
  section: CreatorWorkspaceSection;
  children: ReactNode;
};

export type DraftState = Record<string, { pitch: string; rate: string }>;

export type BrandConnection = {
  name: string;
  headline: string | null;
  openCampaigns: number;
  applied: number;
  accepted: number;
  offers: number;
  pendingOffers: number;
  latestCampaign: string;
  platforms: string[];
};

export type CreatorProfileFormState = {
  firstName: string;
  lastName: string;
  headline: string;
  location: string;
  baseRate: string;
  engagementRate: string;
  averageViews: string;
  bio: string;
  niches: string;
  platformSpecialties: string;
  featuredBrands: string;
  featuredResult: string;
  audienceSummary: string;
  pastWork: string;
  portfolioUrl: string;
  instagramUrl: string;
  instagramHandle: string;
  instagramFollowers: string;
  tiktokUrl: string;
  tiktokHandle: string;
  tiktokFollowers: string;
  youtubeUrl: string;
  youtubeHandle: string;
  youtubeSubscribers: string;
  websiteUrl: string;
};

export type IconProps = {
  className?: string;
};

export type CreatorWorkspaceSectionContext = {
  profile: UserProfile & { role: "creator" };
  data: CreatorDashboardData;
  displayName: string;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  expandedCampaignId: string | null;
  setExpandedCampaignId: Dispatch<SetStateAction<string | null>>;
  drafts: DraftState;
  setDrafts: Dispatch<SetStateAction<DraftState>>;
  feedback: string | null;
  pendingCampaignId: string | null;
  profileForm: CreatorProfileFormState;
  updateProfileForm: <Key extends keyof CreatorProfileFormState>(key: Key, value: CreatorProfileFormState[Key]) => void;
  profileFeedback: string | null;
  portfolioFiles: File[];
  setPortfolioFiles: Dispatch<SetStateAction<File[]>>;
  portfolioFeedback: string | null;
  isUploadingPortfolio: boolean;
  pendingPortfolioRemovalId: string | null;
  isRefreshing: boolean;
  isSavingProfile: boolean;
  isSubmittingProfile: boolean;
  brandConnections: BrandConnection[];
  chatCandidates: ReturnType<typeof buildCreatorChatCandidates>;
  pendingInvitations: CreatorDashboardData["invitations"];
  acceptedApplications: CreatorDashboardData["applications"];
  acceptedValue: number;
  filteredCampaigns: CreatorDashboardData["campaigns"];
  handleApply: (campaignId: string) => Promise<void>;
  handleProfileSave: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handlePortfolioUpload: () => Promise<void>;
  handlePortfolioRemove: (asset: CreatorPortfolioAsset) => Promise<void>;
};
