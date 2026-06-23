import { createClient } from "@/lib/supabase/server";
import type {
  ChatCounterpartProfileSummary,
  ChatConversationSummary,
  ChatMessage,
  PublicProfile,
  Role,
} from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ChatActor = {
  id: string;
  role: Role;
  display_name: string;
  headline: string | null;
};

type ConversationRow = {
  id: string;
  brand_id: string;
  creator_id: string;
  campaign_id: string | null;
  created_at: string;
  last_message_at: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizePublicProfile(row: Record<string, unknown>): PublicProfile {
  const role = row.role === "brand" ? "brand" : "creator";

  return {
    id: readString(row.id),
    role,
    active:
      typeof row.active === "boolean"
        ? row.active
        : undefined,
    display_name: readNullableString(row.display_name),
    full_name: readNullableString(row.full_name),
    company_name: readNullableString(row.company_name),
    headline: readNullableString(row.headline),
    avatar_url: readNullableString(row.avatar_url),
  };
}

function normalizeConversation(row: Record<string, unknown>): ConversationRow {
  return {
    id: readString(row.id),
    brand_id: readString(row.brand_id),
    creator_id: readString(row.creator_id),
    campaign_id: readNullableString(row.campaign_id),
    created_at: readString(row.created_at),
    last_message_at: readNullableString(row.last_message_at),
  };
}

function normalizeMessage(row: Record<string, unknown>): MessageRow {
  return {
    id: readString(row.id),
    conversation_id: readString(row.conversation_id),
    sender_id: readString(row.sender_id),
    body: readString(row.body),
    created_at: readString(row.created_at),
  };
}

export async function requireChatActor(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("public_profiles")
    .select("id, role, display_name, headline")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    role: profile.role === "brand" ? "brand" : "creator",
    display_name: profile.display_name ?? "Member",
    headline: profile.headline ?? null,
  } satisfies ChatActor;
}

async function getProfilesMap(
  supabase: SupabaseServerClient,
  ids: string[],
) {
  if (!ids.length) {
    return new Map<string, PublicProfile>();
  }

  const uniqueIds = [...new Set(ids)];
  const { data } = await supabase
    .from("public_profiles")
    .select("id, role, display_name, full_name, company_name, headline, avatar_url, active")
    .in("id", uniqueIds);

  return new Map(
    (data ?? []).map((row) => {
      const profile = normalizePublicProfile(row as Record<string, unknown>);
      return [profile.id, profile];
    }),
  );
}

async function getCampaignMap(
  supabase: SupabaseServerClient,
  ids: string[],
) {
  if (!ids.length) {
    return new Map<string, { title: string; deadline: string | null; duration: string | null }>();
  }

  const uniqueIds = [...new Set(ids)];
  const { data } = await supabase
    .from("campaigns")
    .select("id, title, deadline, duration")
    .in("id", uniqueIds);

  return new Map(
    (data ?? []).map((row) => [
      readString(row.id),
      {
        title: readString(row.title),
        deadline: readNullableString(row.deadline),
        duration: readNullableString(row.duration),
      },
    ]),
  );
}

async function getLatestMessagesMap(
  supabase: SupabaseServerClient,
  conversationIds: string[],
) {
  if (!conversationIds.length) {
    return new Map<string, MessageRow>();
  }

  const { data } = await supabase
    .from("chat_messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  const latest = new Map<string, MessageRow>();

  for (const row of data ?? []) {
    const message = normalizeMessage(row as Record<string, unknown>);

    if (!latest.has(message.conversation_id)) {
      latest.set(message.conversation_id, message);
    }
  }

  return latest;
}

async function getCreatorProfileSummaryMap(params: {
  supabase: SupabaseServerClient;
  brandId: string;
  creatorIds: string[];
  campaignMap: Map<string, { title: string; deadline: string | null; duration: string | null }>;
}) {
  const { supabase, brandId, creatorIds, campaignMap } = params;

  if (!creatorIds.length) {
    return new Map<string, ChatCounterpartProfileSummary>();
  }

  const uniqueCreatorIds = [...new Set(creatorIds)];
  const [{ data: submissions }, { data: payouts }, { data: orders }] = await Promise.all([
    supabase
      .from("campaign_submissions")
      .select("id, creator_id, campaign_id")
      .eq("brand_id", brandId)
      .in("creator_id", uniqueCreatorIds),
    supabase
      .from("campaign_payouts")
      .select("creator_id, submission_id, creator_amount")
      .eq("brand_id", brandId)
      .in("creator_id", uniqueCreatorIds),
    supabase
      .from("brand_store_attributed_orders")
      .select("submission_id, total")
      .eq("brand_id", brandId),
  ]);

  const submissionsByCreator = new Map<
    string,
    Array<{ id: string; campaign_id: string | null }>
  >();

  for (const row of submissions ?? []) {
    const creatorId = readString(row.creator_id);
    const existing = submissionsByCreator.get(creatorId) ?? [];
    existing.push({
      id: readString(row.id),
      campaign_id: readNullableString(row.campaign_id),
    });
    submissionsByCreator.set(creatorId, existing);
  }

  const spendByCreator = new Map<string, number>();

  for (const row of payouts ?? []) {
    const creatorId = readString(row.creator_id);
    spendByCreator.set(
      creatorId,
      (spendByCreator.get(creatorId) ?? 0) +
      (readNullableNumber(row.creator_amount) ?? 0),
    );
  }

  const creatorIdBySubmission = new Map<string, string>();

  submissionsByCreator.forEach((creatorSubmissions, creatorId) => {
    creatorSubmissions.forEach((submission) => {
      creatorIdBySubmission.set(submission.id, creatorId);
    });
  });

  const gmvByCreator = new Map<string, number>();

  for (const row of orders ?? []) {
    const submissionId = readNullableString(row.submission_id);

    if (!submissionId) {
      continue;
    }

    const creatorId = creatorIdBySubmission.get(submissionId);

    if (!creatorId) {
      continue;
    }

    gmvByCreator.set(
      creatorId,
      (gmvByCreator.get(creatorId) ?? 0) + (readNullableNumber(row.total) ?? 0),
    );
  }

  const summaryMap = new Map<string, ChatCounterpartProfileSummary>();

  uniqueCreatorIds.forEach((creatorId) => {
    const creatorSubmissions = submissionsByCreator.get(creatorId) ?? [];
    const briefMap = new Map<string, { title: string; subtitle: string | null }>();

    creatorSubmissions.forEach((submission) => {
      const campaign = submission.campaign_id
        ? campaignMap.get(submission.campaign_id) ?? null
        : null;
      const title = campaign?.title ?? "Untitled brief";
      const subtitle = campaign?.deadline
        ? `Due ${campaign.deadline}`
        : campaign?.duration ?? null;

      if (!briefMap.has(title)) {
        briefMap.set(title, { title, subtitle });
      }
    });

    const gmv = gmvByCreator.get(creatorId) ?? 0;
    const spend = spendByCreator.get(creatorId) ?? 0;

    summaryMap.set(creatorId, {
      posts: creatorSubmissions.length,
      roas: spend > 0 ? gmv / spend : null,
      gmv: gmv > 0 ? gmv : null,
      rating: null,
      active_briefs: [...briefMap.values()].slice(0, 3),
    });
  });

  return summaryMap;
}

export async function getConversationSummaries(
  supabase: SupabaseServerClient,
  actor: ChatActor,
) {
  const { data } = await supabase
    .from("chat_conversations")
    .select("id, brand_id, creator_id, campaign_id, created_at, last_message_at")
    .eq(actor.role === "brand" ? "brand_id" : "creator_id", actor.id)
    .order("last_message_at", { ascending: false });

  const conversations = (data ?? []).map((row) =>
    normalizeConversation(row as Record<string, unknown>),
  );
  const counterpartIds = conversations.map((conversation) =>
    actor.role === "brand" ? conversation.creator_id : conversation.brand_id,
  );
  const profiles = await getProfilesMap(supabase, counterpartIds);

  const campaignMap = await getCampaignMap(
    supabase,
    conversations
      .map((conversation) => conversation.campaign_id)
      .filter((campaignId): campaignId is string => Boolean(campaignId)),
  );
  const latestMessages = await getLatestMessagesMap(
    supabase,
    conversations.map((conversation) => conversation.id),
  );
  const creatorProfileSummaryMap =
    actor.role === "brand"
      ? await getCreatorProfileSummaryMap({
        supabase,
        brandId: actor.id,
        creatorIds: counterpartIds,
        campaignMap,
      })
      : new Map<string, ChatCounterpartProfileSummary>();

  return conversations.map((conversation) => {
    const counterpartId =
      actor.role === "brand" ? conversation.creator_id : conversation.brand_id;
    const counterpart = profiles.get(counterpartId);
    const latestMessage = latestMessages.get(conversation.id);

    return {
      id: conversation.id,
      brand_id: conversation.brand_id,
      creator_id: conversation.creator_id,
      campaign_id: conversation.campaign_id,
      campaign_title: conversation.campaign_id
        ? campaignMap.get(conversation.campaign_id)?.title ?? null
        : null,
      counterpart_id: counterpartId,
      counterpart_name:
        counterpart?.display_name ??
        counterpart?.company_name ??
        counterpart?.full_name ??
        "Member",
      counterpart_headline: counterpart?.headline ?? null,
      active: counterpart?.active ?? false,
      latest_message_preview: latestMessage?.body ?? null,
      latest_message_at: latestMessage?.created_at ?? conversation.last_message_at,
      created_at: conversation.created_at,
      counterpart_profile:
        actor.role === "brand"
          ? creatorProfileSummaryMap.get(counterpartId) ?? null
          : null,
    } satisfies ChatConversationSummary;
  });
}

export async function getConversationById(
  supabase: SupabaseServerClient,
  actor: ChatActor,
  conversationId: string,
) {
  const { data } = await supabase
    .from("chat_conversations")
    .select("id, brand_id, creator_id, campaign_id, created_at, last_message_at")
    .eq("id", conversationId)
    .eq(actor.role === "brand" ? "brand_id" : "creator_id", actor.id)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return normalizeConversation(data as Record<string, unknown>);
}

export async function getConversationMessages(
  supabase: SupabaseServerClient,
  conversationId: string,
) {
  const { data } = await supabase
    .from("chat_messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const messages = (data ?? []).map((row) =>
    normalizeMessage(row as Record<string, unknown>),
  );
  const profiles = await getProfilesMap(
    supabase,
    messages.map((message) => message.sender_id),
  );

  return messages.map((message) => {
    const sender = profiles.get(message.sender_id);

    return {
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      sender_name:
        sender?.display_name ?? sender?.company_name ?? sender?.full_name ?? "Member",
      body: message.body,
      created_at: message.created_at,
    } satisfies ChatMessage;
  });
}

export async function resolveConversationSeed(params: {
  supabase: SupabaseServerClient;
  actor: ChatActor;
  counterpartId: string;
}) {
  const { supabase, actor, counterpartId } = params;

  const { data: counterpart } = await supabase
    .from("public_profiles")
    .select("id, role, display_name, full_name, company_name, headline, avatar_url")
    .eq("id", counterpartId)
    .maybeSingle();

  if (!counterpart) {
    return null;
  }

  const counterpartProfile = normalizePublicProfile(
    counterpart as Record<string, unknown>,
  );

  if (counterpartProfile.role === actor.role) {
    return null;
  }

  const brandId = actor.role === "brand" ? actor.id : counterpartId;
  const creatorId = actor.role === "creator" ? actor.id : counterpartId;

  const { data: applications } =
    actor.role === "brand"
      ? await supabase
        .from("campaign_applications")
        .select("campaign_id, created_at")
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false })
      : await supabase
        .from("campaign_applications")
        .select("campaign_id, created_at")
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false });

  const campaignIds = (applications ?? []).map((application) =>
    readString(application.campaign_id),
  );

  if (!campaignIds.length) {
    return null;
  }

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title, brand_id")
    .in("id", campaignIds)
    .eq("brand_id", brandId);

  const campaign = (campaigns ?? [])[0];

  if (!campaign) {
    return null;
  }

  return {
    brandId,
    creatorId,
    campaignId: readString(campaign.id),
    campaignTitle: readString(campaign.title),
    counterpart: counterpartProfile,
  };
}
