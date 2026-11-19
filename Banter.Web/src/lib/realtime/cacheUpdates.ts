import type { InfiniteData } from '@tanstack/react-query';
import type {
  ChatMessage,
  InboxConversation,
  InboxPage,
  MessageNotification,
  MessagesPage,
} from '../api/contracts';

export type MessagePages = InfiniteData<MessagesPage, string | null>;

function timestamp(value: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function sortConversationsByActivity(
  conversations: InboxConversation[],
): InboxConversation[] {
  return [...conversations].sort(
    (left, right) => timestamp(right.lastMessageCreatedAt) - timestamp(left.lastMessageCreatedAt),
  );
}

function mapPages(
  data: MessagePages | undefined,
  update: (messages: ChatMessage[]) => ChatMessage[],
): MessagePages | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({ ...page, messages: update(page.messages) })),
  };
}

export function prependMessage(
  data: MessagePages | undefined,
  message: ChatMessage,
): MessagePages | undefined {
  if (!data || data.pages.length === 0) return data;
  if (data.pages.some((page) => page.messages.some((item) => item.id === message.id))) {
    return data;
  }
  const [first, ...rest] = data.pages;
  return {
    ...data,
    pages: [{ ...first, messages: [message, ...first.messages] }, ...rest],
  };
}

export function replaceMessageId(
  data: MessagePages | undefined,
  tempId: string,
  messageId: string,
): MessagePages | undefined {
  return mapPages(data, (messages) =>
    messages.map((message) => (message.id === tempId ? { ...message, id: messageId } : message)),
  );
}

export function removeMessage(
  data: MessagePages | undefined,
  messageId: string,
): MessagePages | undefined {
  return mapPages(data, (messages) => messages.filter((message) => message.id !== messageId));
}

export function updateInboxAfterSend(
  inbox: InboxPage | undefined,
  conversationId: string,
  content: string,
  createdAt: string,
): InboxPage | undefined {
  if (!inbox) return inbox;
  const conversations = sortConversationsByActivity(
    inbox.conversations.map((conversation) =>
      conversation.conversationId === conversationId
        ? {
            ...conversation,
            lastMessageContent: content,
            lastMessageCreatedAt: createdAt,
            unreadCount: 0,
          }
        : conversation,
    ),
  );
  return { ...inbox, conversations };
}

export function markConversationRead(
  inbox: InboxPage | undefined,
  conversationId: string,
): InboxPage | undefined {
  if (!inbox) return inbox;
  return {
    ...inbox,
    conversations: inbox.conversations.map((conversation) =>
      conversation.conversationId === conversationId
        ? { ...conversation, unreadCount: 0 }
        : conversation,
    ),
  };
}

export function hasConversation(inbox: InboxPage | undefined, conversationId: string): boolean {
  return (
    inbox?.conversations.some(
      (conversation) => conversation.conversationId === conversationId,
    ) ?? false
  );
}

export function applyIncomingMessage(
  inbox: InboxPage | undefined,
  notification: MessageNotification,
  options: { isActive: boolean; currentUserId: string },
): InboxPage | undefined {
  if (!inbox) return inbox;
  const isOwnMessage = notification.userId === options.currentUserId;
  const conversations = sortConversationsByActivity(
    inbox.conversations.map((conversation) => {
      if (conversation.conversationId !== notification.conversationId) return conversation;
      return {
        ...conversation,
        lastMessageContent: notification.content,
        lastMessageCreatedAt: notification.createdAt,
        unreadCount:
          options.isActive || isOwnMessage ? 0 : conversation.unreadCount + 1,
      };
    }),
  );
  return { ...inbox, conversations };
}
