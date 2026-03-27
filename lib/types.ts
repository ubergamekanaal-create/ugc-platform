export type Role = "creator" | "brand";

export type StoreProvider = "shopify" | "non_shopify" | "headless_shopify";

export type StoreConnectionStatus = "connected" | "pending" | "error";

export type CampaignStatus = "open" | "in_review" | "active" | "completed";

export type ApplicationStatus =
  | "pending"
  | "shortlisted"
  | "accepted"
  | "declined";

export type InvitationStatus = "pending" | "accepted" | "declined";

export type UserProfile = {
  id: string;
  email: string;
  role: Role;
  full_name: string | null;
  company_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  stripe_account_id: string | null;
  created_at: string | null;
};

export type PublicProfile = {
  id: string;
  role: Role;
  display_name: string | null;
  full_name: string | null;
  company_name: string | null;
  headline: string | null;
  avatar_url: string | null;
};

export type Campaign = {
  id: string;
  brand_id: string;
  title: string;
  description: string;
  budget: number;
  status: CampaignStatus;
  platforms: string[];
  deliverables: string;
  creator_slots: number;
  duration: string;
  payment_type: string;
  created_at: string;
};

export type CampaignApplication = {
  id: string;
  campaign_id: string;
  creator_id: string;
  pitch: string;
  rate: number;
  status: ApplicationStatus;
  created_at: string;
};

export type BrandCampaignSummary = Campaign & {
  application_count: number;
};

export type BrandApplicationSummary = CampaignApplication & {
  campaign_title: string;
  creator_name: string;
  creator_headline: string | null;
};

export type CampaignInvitation = {
  id: string;
  campaign_id: string;
  brand_id: string;
  creator_id: string;
  message: string | null;
  offered_rate: number;
  status: InvitationStatus;
  created_at: string;
  updated_at: string;
};

export type BrandCreatorDirectoryEntry = {
  id: string;
  name: string;
  headline: string | null;
  avatar_url: string | null;
  applications: number;
  accepted: number;
  rate: number;
  focus: string;
  latest_campaign_title: string | null;
  latest_application_at: string | null;
  invitations: number;
  pending_invitations: number;
  invited_campaign_ids: string[];
  last_invited_at: string | null;
};

export type CreatorCampaignSummary = Campaign & {
  brand_name: string;
  brand_headline: string | null;
  has_applied: boolean;
};

export type CreatorApplicationSummary = CampaignApplication & {
  campaign_title: string;
  campaign_budget: number;
  brand_id: string;
  brand_name: string;
};

export type CreatorInvitationSummary = CampaignInvitation & {
  campaign_title: string;
  campaign_budget: number;
  campaign_description: string;
  deliverables: string;
  duration: string;
  payment_type: string;
  platforms: string[];
  brand_name: string;
  brand_headline: string | null;
};

export type BrandDashboardData = {
  campaigns: BrandCampaignSummary[];
  applications: BrandApplicationSummary[];
  creators: BrandCreatorDirectoryEntry[];
  invitations: CampaignInvitation[];
};

export type CreatorDashboardData = {
  campaigns: CreatorCampaignSummary[];
  applications: CreatorApplicationSummary[];
  invitations: CreatorInvitationSummary[];
};

export type DashboardMetric = {
  label: string;
  value: string;
  hint: string;
};

export type BrandStoreConnectionSummary = {
  id: string;
  provider: StoreProvider;
  store_name: string | null;
  store_url: string;
  store_domain: string;
  api_version: string;
  status: StoreConnectionStatus;
  product_count: number;
  connected_at: string;
  last_synced_at: string | null;
  has_storefront_access_token: boolean;
};

export type BrandStoreProduct = {
  id: string;
  connection_id: string;
  brand_id: string;
  external_product_id: string;
  title: string;
  handle: string | null;
  vendor: string | null;
  product_type: string | null;
  image_url: string | null;
  status: string | null;
  price: number | null;
  currency: string | null;
  synced_at: string;
};

export type ChatCandidate = {
  id: string;
  name: string;
  headline: string | null;
  context_label: string | null;
};

export type ChatConversationSummary = {
  id: string;
  brand_id: string;
  creator_id: string;
  campaign_id: string | null;
  campaign_title: string | null;
  counterpart_id: string;
  counterpart_name: string;
  counterpart_headline: string | null;
  latest_message_preview: string | null;
  latest_message_at: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
};
