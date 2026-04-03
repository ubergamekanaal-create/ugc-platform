export type Role = "creator" | "brand";

export type StoreProvider = "shopify" | "non_shopify" | "headless_shopify";

export type StoreConnectionStatus = "connected" | "pending" | "error";

export type MetaConnectionStatus = "connected" | "pending" | "error";

export type StoreAnalyticsEventName =
  | "page_viewed"
  | "product_viewed"
  | "product_added_to_cart"
  | "checkout_started"
  | "checkout_completed";

export type CampaignStatus = "open" | "in_review" | "active" | "completed";

export type ApplicationStatus =
  | "pending"
  | "shortlisted"
  | "accepted"
  | "declined";

export type InvitationStatus = "pending" | "accepted" | "declined";

export type SubmissionStatus =
  | "submitted"
  | "revision_requested"
  | "approved"
  | "rejected";

export type SubmissionAssetKind = "image" | "video" | "file";

export type FundingStatus = "pending" | "paid" | "cancelled" | "failed";

export type PayoutStatus = "payout_ready" | "paid" | "failed" | "reversed";

export type NotificationType =
  | "campaign_invitation"
  | "invitation_response"
  | "chat_message"
  | "submission_submitted"
  | "submission_revision_requested"
  | "submission_approved"
  | "submission_rejected";

export type UserProfile = {
  id: string;
  email: string;
  role: Role;
  full_name: string | null;
  company_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  stripe_details_submitted: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_transfers_enabled: boolean;
  stripe_onboarding_updated_at: string | null;
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
  product_name: string;
  product_details: string;
  content_type: string;
  budget: number;
  status: CampaignStatus;
  platforms: string[];
  deliverables: string;
  creator_slots: number;
  duration: string;
  deadline: string | null;
  payment_type: string;
  usage_rights: string;
  creator_requirements: string;
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

export type CampaignSubmission = {
  id: string;
  campaign_id: string;
  brand_id: string;
  creator_id: string;
  application_id: string | null;
  revision_number: number;
  content_links: string[];
  notes: string | null;
  feedback: string | null;
  status: SubmissionStatus;
  assets: SubmissionAsset[];
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
};

export type SubmissionAsset = {
  id: string;
  submission_id: string;
  campaign_id: string;
  brand_id: string;
  creator_id: string;
  revision_number: number;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number;
  kind: SubmissionAssetKind;
  signed_url: string | null;
  created_at: string;
};

export type CreatorPortfolioAsset = {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  kind: SubmissionAssetKind;
  size_bytes: number;
  caption: string | null;
  sort_order: number;
  signed_url: string | null;
  created_at: string;
};

export type CampaignFunding = {
  id: string;
  campaign_id: string | null;
  brand_id: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_transfer_group: string | null;
  amount: number;
  currency: string;
  status: FundingStatus;
  created_at: string;
  paid_at: string | null;
};

export type CampaignPayout = {
  id: string;
  campaign_id: string;
  submission_id: string;
  brand_id: string;
  creator_id: string;
  application_id: string | null;
  source_funding_id: string | null;
  amount: number;
  platform_fee_percent: number;
  platform_fee_amount: number;
  creator_amount: number;
  currency: string;
  status: PayoutStatus;
  stripe_transfer_id: string | null;
  stripe_account_id: string | null;
  stripe_source_charge_id: string | null;
  stripe_transfer_group: string | null;
  reversed_amount: number;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  reversed_at: string | null;
};

export type NotificationItem = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type CreatorProfileDetails = {
  user_id: string;
  bio: string | null;
  niches: string[];
  platform_specialties: string[];
  birth_year: number | null;
  portfolio_url: string | null;
  instagram_url: string | null;
  instagram_handle: string | null;
  instagram_followers: number;
  tiktok_url: string | null;
  tiktok_handle: string | null;
  tiktok_followers: number;
  youtube_url: string | null;
  youtube_handle: string | null;
  youtube_subscribers: number;
  website_url: string | null;
  base_rate: number;
  engagement_rate: number;
  average_views: number;
  monthly_ugc_videos: number;
  featured_content_links: string[];
  featured_brands: string[];
  featured_result: string | null;
  audience_summary: string | null;
  past_work: string | null;
  location: string | null;
  onboarding_completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type BrandCreatorDirectoryEntry = {
  id: string;
  name: string;
  headline: string | null;
  avatar_url: string | null;
  applications: number;
  accepted: number;
  rate: number;
  base_rate: number;
  focus: string;
  bio: string | null;
  niches: string[];
  platform_specialties: string[];
  birth_year: number | null;
  portfolio_url: string | null;
  instagram_url: string | null;
  instagram_handle: string | null;
  instagram_followers: number;
  tiktok_url: string | null;
  tiktok_handle: string | null;
  tiktok_followers: number;
  youtube_url: string | null;
  youtube_handle: string | null;
  youtube_subscribers: number;
  website_url: string | null;
  engagement_rate: number;
  average_views: number;
  monthly_ugc_videos: number;
  featured_content_links: string[];
  featured_brands: string[];
  featured_result: string | null;
  portfolio_assets: CreatorPortfolioAsset[];
  audience_summary: string | null;
  past_work: string | null;
  location: string | null;
  onboarding_completed_at: string | null;
  latest_campaign_title: string | null;
  latest_application_at: string | null;
  invitations: number;
  pending_invitations: number;
  invited_campaign_ids: string[];
  last_invited_at: string | null;
};

export type BrandSubmissionSummary = CampaignSubmission & {
  campaign_title: string;
  creator_name: string;
  creator_headline: string | null;
  rate: number;
};

export type BrandFundingSummary = CampaignFunding & {
  campaign_title: string | null;
};

export type BrandPayoutSummary = CampaignPayout & {
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
  campaign_description: string;
  product_name: string;
  product_details: string;
  content_type: string;
  deliverables: string;
  duration: string;
  deadline: string | null;
  payment_type: string;
  usage_rights: string;
  creator_requirements: string;
  platforms: string[];
  brand_id: string;
  brand_name: string;
  brand_headline: string | null;
};

export type CreatorInvitationSummary = CampaignInvitation & {
  campaign_title: string;
  campaign_budget: number;
  campaign_description: string;
  product_name: string;
  product_details: string;
  content_type: string;
  deliverables: string;
  duration: string;
  deadline: string | null;
  payment_type: string;
  usage_rights: string;
  creator_requirements: string;
  platforms: string[];
  brand_name: string;
  brand_headline: string | null;
};

export type CreatorSubmissionSummary = CampaignSubmission & {
  campaign_title: string;
  campaign_budget: number;
  campaign_description: string;
  product_name: string;
  product_details: string;
  content_type: string;
  deliverables: string;
  duration: string;
  deadline: string | null;
  payment_type: string;
  usage_rights: string;
  creator_requirements: string;
  platforms: string[];
  brand_name: string;
  brand_headline: string | null;
  rate: number;
};

export type CreatorPayoutSummary = CampaignPayout & {
  campaign_title: string;
  brand_name: string;
  brand_headline: string | null;
};

export type BrandDashboardData = {
  campaigns: BrandCampaignSummary[];
  applications: BrandApplicationSummary[];
  submissions: BrandSubmissionSummary[];
  creators: BrandCreatorDirectoryEntry[];
  invitations: CampaignInvitation[];
  fundings: BrandFundingSummary[];
  payouts: BrandPayoutSummary[];
};

export type CreatorDashboardData = {
  campaigns: CreatorCampaignSummary[];
  applications: CreatorApplicationSummary[];
  invitations: CreatorInvitationSummary[];
  submissions: CreatorSubmissionSummary[];
  payouts: CreatorPayoutSummary[];
  profile_details: CreatorProfileDetails | null;
  profile_assets: CreatorPortfolioAsset[];
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
  analytics_webhook_status: "not_configured" | "configured" | "error";
  analytics_webhooks_registered_at: string | null;
  last_webhook_at: string | null;
  last_webhook_error: string | null;
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

export type BrandMetaConnectionSummary = {
  id: string;
  brand_id: string;
  meta_user_id: string;
  meta_user_name: string | null;
  business_id: string | null;
  business_name: string | null;
  ad_account_id: string | null;
  ad_account_name: string | null;
  status: MetaConnectionStatus;
  permissions: string[];
  token_expires_at: string | null;
  connected_at: string;
  last_synced_at: string | null;
  last_error: string | null;
};

export type BrandMetaAdAccountSummary = {
  id: string;
  connection_id: string;
  brand_id: string;
  meta_account_id: string;
  account_name: string;
  account_status: string | null;
  currency: string | null;
  business_id: string | null;
  business_name: string | null;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
};

export type BrandMetaCampaignSummary = {
  id: string;
  connection_id: string;
  brand_id: string;
  ad_account_id: string;
  meta_campaign_id: string;
  source_submission_id: string | null;
  destination_url: string | null;
  tracking_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  name: string;
  objective: string | null;
  status: string | null;
  effective_status: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number | null;
  cpm: number | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
};

export type BrandMetaAdSetSummary = {
  id: string;
  connection_id: string;
  campaign_id: string;
  brand_id: string;
  source_submission_id: string | null;
  meta_campaign_id: string;
  meta_ad_set_id: string;
  name: string;
  status: string | null;
  effective_status: string | null;
  destination_type: string | null;
  billing_event: string | null;
  optimization_goal: string | null;
  daily_budget: number | null;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number | null;
  cpm: number | null;
  targeting_countries: string[];
  synced_at: string;
  created_at: string;
  updated_at: string;
};

export type BrandMetaAdSummary = {
  id: string;
  connection_id: string;
  campaign_id: string;
  ad_set_id: string;
  brand_id: string;
  source_submission_id: string | null;
  selected_asset_id: string | null;
  meta_campaign_id: string;
  meta_ad_set_id: string;
  meta_ad_id: string;
  meta_creative_id: string | null;
  name: string;
  status: string | null;
  effective_status: string | null;
  page_id: string | null;
  source_asset_kind: string | null;
  source_asset_url: string | null;
  destination_url: string | null;
  tracking_url: string | null;
  primary_text: string | null;
  headline: string | null;
  description: string | null;
  call_to_action_type: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number | null;
  cpm: number | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
};

export type BrandStoreAnalyticsSettings = {
  id: string;
  brand_id: string;
  connection_id: string | null;
  public_tracking_token: string;
  utm_source_default: string;
  utm_medium_default: string;
  utm_campaign_prefix: string;
  utm_term_default: string | null;
  enable_page_view: boolean;
  enable_product_view: boolean;
  enable_add_to_cart: boolean;
  enable_checkout_started: boolean;
  enable_checkout_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type BrandStoreAnalyticsEvent = {
  id: string;
  brand_id: string;
  connection_id: string | null;
  event_name: StoreAnalyticsEventName;
  event_id: string | null;
  client_id: string | null;
  session_id: string | null;
  shop_domain: string | null;
  shop_order_id: string | null;
  campaign_id: string | null;
  submission_id: string | null;
  meta_campaign_id: string | null;
  page_url: string | null;
  landing_url: string | null;
  referrer_url: string | null;
  referral_code: string | null;
  currency: string | null;
  value: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  created_at: string;
};

export type BrandStoreAttributedOrder = {
  id: string;
  brand_id: string;
  connection_id: string | null;
  shop_domain: string;
  shop_order_id: string;
  shopify_order_gid: string | null;
  order_name: string | null;
  customer_email: string | null;
  financial_status: string | null;
  fulfillment_status: string | null;
  source_name: string | null;
  currency: string | null;
  subtotal: number | null;
  discount_total: number | null;
  shipping_total: number | null;
  tax_total: number | null;
  total: number | null;
  landing_url: string | null;
  referrer_url: string | null;
  referral_code: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  campaign_id: string | null;
  submission_id: string | null;
  meta_campaign_id: string | null;
  ordered_at: string | null;
  created_at: string;
  updated_at: string;
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
