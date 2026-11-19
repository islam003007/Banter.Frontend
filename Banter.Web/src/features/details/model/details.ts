import type { ConversationDetail, ConversationParticipant } from '../../../lib/api/contracts';
import { resolveIsBot } from '../../../lib/bots';

export interface DetailsIdentity {
  isGroup: boolean;
  displayName: string;
  participants: ConversationParticipant[];
  isBotConversation: boolean;
  onlineCount: number;
}

export function resolveDetailsIdentity({
  detail,
  fallbackName,
  fallbackIsGroup,
  currentUserId,
}: {
  detail?: ConversationDetail;
  fallbackName: string;
  fallbackIsGroup: boolean;
  currentUserId?: string;
}): DetailsIdentity {
  const isGroup = detail?.isGroup ?? fallbackIsGroup;
  const name = detail?.title ?? detail?.displayName ?? fallbackName;
  const participants = detail?.participants ?? [];
  const otherParticipant = participants.find(
    (participant) => participant.userId !== currentUserId,
  );
  const displayName = !isGroup && otherParticipant ? otherParticipant.displayName : name;
  const isBotConversation =
    !isGroup && resolveIsBot(otherParticipant?.isBot ?? detail?.isBot, displayName);
  const onlineCount = participants.filter(
    (participant) =>
      !resolveIsBot(participant.isBot, participant.displayName) && participant.isOnline,
  ).length;

  return { isGroup, displayName, participants, isBotConversation, onlineCount };
}

export function detailsChannelType(identity: DetailsIdentity): string {
  if (identity.isGroup) return 'group channel';
  if (identity.isBotConversation) return 'AI operator channel';
  return 'direct channel';
}
