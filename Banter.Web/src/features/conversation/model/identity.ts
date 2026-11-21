import { useMemo } from 'react';
import type {
  ConversationDetail,
  ConversationParticipant,
  InboxConversation,
} from '../../../lib/api/contracts';
import { resolveIsBot } from '../../../lib/bots';

export interface ConversationIdentity {
  isGroup: boolean;
  title: string;
  online: boolean;
  participants: ConversationParticipant[];
  onlineCount: number;
  otherParticipant: ConversationParticipant | undefined;
  isBotConversation: boolean;
}

export function resolveConversationIdentity({
  detail,
  fallback,
  currentUserId,
}: {
  detail?: ConversationDetail;
  fallback?: InboxConversation;
  currentUserId?: string;
}): ConversationIdentity {
  const isGroup = detail?.isGroup ?? fallback?.isGroup ?? false;
  const participants = detail?.participants ?? [];
  const otherParticipant = participants.find(
    (participant) => participant.userId !== currentUserId,
  );
  const title = isGroup
    ? detail?.title || fallback?.displayName || 'Group channel'
    : otherParticipant?.displayName ||
      fallback?.displayName ||
      detail?.displayName ||
      'Channel';
  const online = otherParticipant?.isOnline ?? fallback?.isOnline ?? false;
  const onlineCount = participants.filter(
    (participant) =>
      !resolveIsBot(participant.isBot, participant.displayName) && participant.isOnline,
  ).length;
  const otherIsBot = otherParticipant
    ? resolveIsBot(otherParticipant.isBot, otherParticipant.displayName)
    : resolveIsBot(detail?.isBot ?? fallback?.isBot, title);

  return {
    isGroup,
    title,
    online,
    participants,
    onlineCount,
    otherParticipant,
    isBotConversation: !isGroup && otherIsBot,
  };
}

export function channelKind(identity: ConversationIdentity): string {
  if (identity.isGroup) return 'group channel';
  if (identity.isBotConversation) return 'AI operator';
  return 'direct channel';
}

export function channelDetail(
  identity: ConversationIdentity,
  typingBot: string | null,
): string {
  if (typingBot) return `${typingBot} is typing…`;
  if (identity.isGroup) {
    if (identity.participants.length === 0) return 'group channel';
    return `${identity.participants.length} in channel${
      identity.onlineCount > 0 ? ` · ${identity.onlineCount} online` : ''
    }`;
  }
  if (identity.isBotConversation) return 'AI operator · direct channel';
  return identity.online ? 'direct channel · online' : 'direct channel · away';
}

export function useConversationIdentity(
  detail: ConversationDetail | undefined,
  fallback: InboxConversation | undefined,
  currentUserId: string | undefined,
): ConversationIdentity {
  return useMemo(
    () => resolveConversationIdentity({ detail, fallback, currentUserId }),
    [detail, fallback, currentUserId],
  );
}
