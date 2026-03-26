export type Role = "creator" | "brand";

export type StoreProvider = "shopify" | "non_shopify" | "headless_shopify";

export type StoreConnectionStatus = "connected" | "pending" | "error";

export type CampaignStatus = "open" | "in_review" | "active" | "completed";

export type ApplicationStatus =
  | "pending"
  | "shortlisted"
  | "accepted"
  | "declined";

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

export type CreatorCampaignSummary = Campaign & {
  brand_name: string;
  brand_headline: string | null;
  has_applied: boolean;
};

export type CreatorApplicationSummary = CampaignApplication & {
  campaign_title: string;
  campaign_budget: number;
  brand_name: string;
};

export type BrandDashboardData = {
  campaigns: BrandCampaignSummary[];
  applications: BrandApplicationSummary[];
};

export type CreatorDashboardData = {
  campaigns: CreatorCampaignSummary[];
  applications: CreatorApplicationSummary[];
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
