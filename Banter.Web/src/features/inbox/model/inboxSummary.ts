import type { InboxConversation } from '../../../lib/api/contracts';
import { resolveIsBot } from '../../../lib/bots';

export function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function threadTimestamp(conversation: InboxConversation): number {
  if (!conversation.lastMessageCreatedAt) return 0;
  const time = new Date(conversation.lastMessageCreatedAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function unreadLabel(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function padCount(count: number): string {
  return count > 0 ? String(count).padStart(2, '0') : '00';
}

export interface InboxSummary {
  activeThreads: InboxConversation[];
  pickupThreads: InboxConversation[];
  latest: InboxConversation | undefined;
  unreadTotal: number;
  liveNow: number;
  botThreads: Map<string, InboxConversation>;
}

export function buildInboxSummary(conversations: InboxConversation[]): InboxSummary {
  const activeThreads = [...conversations].sort(
    (left, right) =>
      threadTimestamp(right) - threadTimestamp(left) || right.unreadCount - left.unreadCount,
  );
  const unreadTotal = conversations.reduce(
    (sum, conversation) => sum + conversation.unreadCount,
    0,
  );
  const liveNow = conversations.filter(
    (conversation) =>
      !conversation.isGroup &&
      !resolveIsBot(conversation.isBot, conversation.displayName) &&
      conversation.isOnline,
  ).length;
  const botThreads = new Map(
    conversations
      .filter(
        (conversation) =>
          !conversation.isGroup && resolveIsBot(conversation.isBot, conversation.displayName),
      )
      .map((conversation) => [conversation.displayName.trim().toLowerCase(), conversation]),
  );

  return {
    activeThreads,
    pickupThreads: activeThreads.slice(0, 3),
    latest: activeThreads[0],
    unreadTotal,
    liveNow,
    botThreads,
  };
}
