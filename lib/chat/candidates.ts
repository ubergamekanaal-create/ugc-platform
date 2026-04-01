import type {
  BrandDashboardData,
  ChatCandidate,
  CreatorDashboardData,
} from "@/lib/types";

export function buildBrandChatCandidates(
  data: BrandDashboardData,
): ChatCandidate[] {
  const candidates = new Map<string, ChatCandidate>();

  for (const application of data.applications) {
    if (!application.creator_id || candidates.has(application.creator_id)) {
      continue;
    }

    candidates.set(application.creator_id, {
      id: application.creator_id,
      name: application.creator_name,
      headline: application.creator_headline,
      context_label: application.campaign_title,
    });
  }

  return [...candidates.values()];
}

export function buildCreatorChatCandidates(
  data: CreatorDashboardData,
): ChatCandidate[] {
  const candidates = new Map<string, ChatCandidate>();

  for (const application of data.applications) {
    if (!application.brand_id || candidates.has(application.brand_id)) {
      continue;
    }

    candidates.set(application.brand_id, {
      id: application.brand_id,
      name: application.brand_name,
      headline: null,
      context_label: application.campaign_title,
    });
  }

  for (const campaign of data.campaigns) {
    if (!campaign.has_applied || candidates.has(campaign.brand_id)) {
      continue;
    }

    candidates.set(campaign.brand_id, {
      id: campaign.brand_id,
      name: campaign.brand_name,
      headline: campaign.brand_headline,
      context_label: campaign.title,
    });
  }

  return [...candidates.values()];
}
