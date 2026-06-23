import { RealtimeChatPanel } from "@/components/dashboard/realtime-chat-panel";
import type { CreatorWorkspaceSectionContext } from "./types";

export function CreatorWorkspaceChatSection({ ctx }: { ctx: CreatorWorkspaceSectionContext }) {
  const {
    profile,
    chatCandidates,
  } = ctx;
    return <RealtimeChatPanel profile={profile} role="creator" candidates={chatCandidates} />;
  }