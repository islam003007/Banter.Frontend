import type {
  ChatMessage,
  ConversationDetail,
  ConversationParticipant,
  CurrentUser,
  DemoUser,
  InboxConversation,
  InboxPage,
  MessagesPage,
  UserSearchResult,
} from './contracts';
import { boolean, list, number, optionalBoolean, record, stringList, text } from './parsing';

export function normalizeCurrentUser(value: unknown): CurrentUser {
  const source = record(record(value).user ?? value);
  return {
    id: text(source.id) ?? text(source.userId) ?? '',
    email: text(source.email) ?? '',
    displayName: text(source.displayName) ?? text(source.name) ?? 'You',
    profilePictureUrl: text(source.profilePictureUrl) ?? text(source.profilePicture) ?? null,
  };
}

export function normalizeDemoUser(value: unknown): DemoUser {
  const source = record(value);
  return {
    id: text(source.id) ?? text(source.userId) ?? '',
    email: text(source.email) ?? '',
    displayName: text(source.displayName) ?? text(source.name) ?? 'Demo user',
    profilePictureUrl: text(source.profilePictureUrl) ?? text(source.profilePicture) ?? null,
  };
}

export function normalizeInboxConversation(value: unknown): InboxConversation {
  const source = record(value);
  const lastMessage = record(source.lastMessage);
  return {
    conversationId: text(source.conversationId) ?? text(source.id) ?? '',
    displayName:
      text(source.displayName) ??
      text(source.title) ??
      text(lastMessage.senderDisplayName) ??
      'Conversation',
    profilePictures: stringList(source.profilePictures ?? source.profilePictureUrls),
    lastMessageContent: text(source.lastMessageContent) ?? text(lastMessage.content),
    lastMessageCreatedAt: text(source.lastMessageCreatedAt) ?? text(lastMessage.createdAt),
    isGroup: boolean(source.isGroup),
    isOnline: boolean(source.isOnline),
    isBot: optionalBoolean(source.isBot ?? source.isBotConversation ?? source.participantIsBot),
    unreadCount: number(source.unreadCount) ?? number(source.unread) ?? 0,
  };
}

export function normalizeParticipant(value: unknown): ConversationParticipant {
  const source = record(value);
  return {
    userId: text(source.userId) ?? text(source.id) ?? '',
    displayName: text(source.displayName) ?? text(source.name) ?? 'Participant',
    profilePictureUrl: text(source.profilePictureUrl) ?? text(source.profilePicture) ?? null,
    isOnline: boolean(source.isOnline ?? source.online),
    isBot: optionalBoolean(source.isBot ?? source.isBotUser ?? source.bot),
  };
}

export function normalizeChatMessage(value: unknown): ChatMessage {
  const source = record(value);
  return {
    id: text(source.id) ?? text(source.messageId) ?? '',
    content: text(source.content) ?? '',
    createdAt: text(source.createdAt) ?? new Date().toISOString(),
    userId: text(source.userId) ?? text(source.senderId) ?? '',
    displayName: text(source.displayName) ?? text(source.senderDisplayName) ?? 'Unknown',
    profilePictureUrl: text(source.profilePictureUrl) ?? text(source.senderProfilePictureUrl) ?? null,
    isBot: optionalBoolean(source.isBot ?? source.senderIsBot ?? source.isBotMessage),
  };
}

export function normalizeSearchUser(value: unknown): UserSearchResult {
  const source = record(value);
  return {
    id: text(source.id) ?? text(source.userId) ?? '',
    displayName: text(source.displayName) ?? text(source.name) ?? 'Unknown',
    email: text(source.email) ?? '',
    profilePictureUrl: text(source.profilePictureUrl) ?? text(source.profilePicture) ?? null,
    isOnline: boolean(source.isOnline ?? source.online),
    isBot: optionalBoolean(source.isBot ?? source.isBotUser ?? source.bot),
    botPersona:
      text(source.botPersona) ??
      text(source.persona) ??
      text(source.botRole) ??
      text(source.role) ??
      text(source.botDescription) ??
      text(source.tagline),
  };
}

export function normalizeId(value: unknown): string {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (typeof parsed === 'string') return parsed;
    } catch {
      return value;
    }
    return value;
  }
  const source = record(value);
  return text(source.id) ?? text(source.conversationId) ?? text(source.messageId) ?? '';
}

export function normalizeInbox(value: unknown): InboxPage {
  const source = record(value);
  const conversations = list(source.conversations ?? source.items).map(
    normalizeInboxConversation,
  );
  return {
    conversations,
    nextCursor: text(source.nextCursor) ?? text(source.nextcursor),
    hasMore: boolean(source.hasMore),
  };
}

export function normalizeMessages(value: unknown): MessagesPage {
  const source = record(value);
  return {
    messages: list(source.messages ?? source.items).map(normalizeChatMessage),
    nextCursor: text(source.nextCursor) ?? text(source.nextcursor),
    hasMore: boolean(source.hasMore),
    lastSeenMessageId: text(source.lastSeenMessageId),
  };
}

export function normalizeDetail(value: unknown, conversationId: string): ConversationDetail {
  const outer = record(value);
  const source = record(outer.conversation ?? outer);
  const rawParticipants = source.participants ?? source.members ?? [];
  return {
    conversationId: text(source.conversationId) ?? text(source.id) ?? conversationId,
    title: text(source.title),
    displayName: text(source.displayName) ?? text(source.title) ?? 'Conversation',
    isGroup: boolean(source.isGroup),
    isBot: optionalBoolean(source.isBot ?? source.isBotConversation),
    participants: list(rawParticipants).map(normalizeParticipant),
  };
}
