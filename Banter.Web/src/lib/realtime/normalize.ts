import type { ChatMessage, MessageNotification } from '../api/contracts';

export function conversationIdFromPath(pathname: string): string | null {
  const match = /^\/c\/([^/]+)/.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function toChatMessage(notification: MessageNotification): ChatMessage {
  return {
    id: notification.id,
    content: notification.content,
    createdAt: notification.createdAt,
    userId: notification.userId,
    displayName: notification.displayName,
    profilePictureUrl: notification.profilePictureUrl,
    isBot: notification.isBot,
  };
}

export function normalizeNotification(value: unknown): MessageNotification | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const id = typeof source.id === 'string' ? source.id : null;
  const conversationId = typeof source.conversationId === 'string' ? source.conversationId : null;
  if (!id || !conversationId) return null;

  const sender =
    source.senderDisplayName ?? source.senderName ?? source.displayName ?? source.userName;
  const profile =
    source.senderProfilePictureUrl ?? source.profilePictureUrl ?? source.senderProfilePicture;
  const isBot = source.isBot ?? source.senderIsBot ?? source.isBotMessage;

  return {
    id,
    conversationId,
    content: typeof source.content === 'string' ? source.content : '',
    userId: typeof source.userId === 'string' ? source.userId : '',
    displayName: typeof sender === 'string' ? sender : 'New message',
    profilePictureUrl: typeof profile === 'string' ? profile : null,
    isBot: typeof isBot === 'boolean' ? isBot : undefined,
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : new Date().toISOString(),
  };
}

export interface BotTypingSignal {
  conversationId: string;
  botName: string;
  active: boolean;
}

export function normalizeBotTyping(
  value: unknown,
  botNameArgument?: unknown,
): BotTypingSignal | null {
  if (typeof value === 'string') {
    const botName =
      typeof botNameArgument === 'string' && botNameArgument.trim()
        ? botNameArgument.trim()
        : 'AI teammate';
    return { conversationId: value, botName, active: true };
  }

  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const conversationId =
    typeof source.conversationId === 'string' ? source.conversationId : null;
  if (!conversationId) return null;

  const candidate =
    source.botName ??
    source.botDisplayName ??
    source.displayName ??
    source.senderDisplayName ??
    source.name;
  const botName =
    typeof candidate === 'string' && candidate.trim() ? candidate.trim() : 'AI teammate';
  const active = source.isTyping ?? source.typing ?? source.active;

  return { conversationId, botName, active: active !== false };
}
