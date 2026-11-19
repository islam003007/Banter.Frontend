import type {
  ChatMessage,
  ConversationDetail,
  CurrentUser,
  InboxConversation,
  InboxPage,
  MessagesPage,
  UserSearchResult,
} from '../lib/api/contracts';

export const currentUser: CurrentUser = {
  id: 'user-ahmed',
  email: 'ahmed@example.com',
  displayName: 'Ahmed',
  profilePictureUrl: null,
};

export const demoUsers: CurrentUser[] = [
  currentUser,
  {
    id: 'user-sara',
    email: 'sara@example.com',
    displayName: 'Sara',
    profilePictureUrl: null,
  },
  {
    id: 'user-mohamed',
    email: 'mohamed@example.com',
    displayName: 'Mohamed',
    profilePictureUrl: null,
  },
];

export function makeConversation(
  overrides: Partial<InboxConversation> = {},
): InboxConversation {
  return {
    conversationId: 'conv-mohamed',
    displayName: 'Mohamed',
    profilePictures: [],
    lastMessageContent: 'hello',
    lastMessageCreatedAt: '2026-05-29T12:00:00.000Z',
    isGroup: false,
    isOnline: false,
    unreadCount: 0,
    ...overrides,
  };
}

export function makeInbox(conversations: InboxConversation[] = []): InboxPage {
  return { conversations, nextCursor: null, hasMore: false };
}

export const mohamedConversation = makeConversation({
  conversationId: 'conv-mohamed',
  displayName: 'Mohamed',
  lastMessageContent: 'hello',
  lastMessageCreatedAt: '2026-05-29T12:00:00.000Z',
  unreadCount: 2,
});
export const adaConversation = makeConversation({
  conversationId: 'conv-ada',
  displayName: 'Ada',
  lastMessageContent: 'That smells like a boundary problem.',
  lastMessageCreatedAt: '2026-05-28T10:00:00.000Z',
  isBot: true,
});
export const designGroup = makeConversation({
  conversationId: 'conv-design',
  displayName: 'Design Crit',
  lastMessageContent: 'Updated both breakpoints.',
  lastMessageCreatedAt: '2026-05-27T10:00:00.000Z',
  isGroup: true,
  unreadCount: 1,
});

export function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'message-1',
    content: 'hello',
    createdAt: '2026-05-29T12:00:00.000Z',
    userId: 'user-mohamed',
    displayName: 'Mohamed',
    profilePictureUrl: null,
    isBot: false,
    ...overrides,
  };
}

export function makeMessagesPage(overrides: Partial<MessagesPage> = {}): MessagesPage {
  return {
    messages: [makeMessage()],
    nextCursor: null,
    hasMore: false,
    lastSeenMessageId: null,
    ...overrides,
  };
}

export function makeDetail(overrides: Partial<ConversationDetail> = {}): ConversationDetail {
  return {
    conversationId: 'conv-mohamed',
    title: null,
    displayName: 'Mohamed',
    isGroup: false,
    isBot: false,
    participants: [
      {
        userId: 'user-ahmed',
        displayName: 'Ahmed',
        profilePictureUrl: null,
        isOnline: true,
      },
      {
        userId: 'user-mohamed',
        displayName: 'Mohamed',
        profilePictureUrl: null,
        isOnline: false,
      },
    ],
    ...overrides,
  };
}

export function makeSearchUser(overrides: Partial<UserSearchResult> = {}): UserSearchResult {
  return {
    id: 'user-sara',
    displayName: 'Sara',
    email: 'sara@example.com',
    profilePictureUrl: null,
    isOnline: true,
    isBot: false,
    botPersona: null,
    ...overrides,
  };
}

export const saraSearchUser = makeSearchUser();
export const adaSearchUser = makeSearchUser({
  id: 'bot-ada',
  displayName: 'Ada',
  email: 'ada@banter.local',
  isBot: true,
  botPersona: 'Systems and backend pair-programmer',
});
export const mohamedSearchUser = makeSearchUser({
  id: 'user-mohamed',
  displayName: 'Mohamed',
  email: 'mohamed@example.com',
  isOnline: false,
});
export const currentUserSearchResult: UserSearchResult = makeSearchUser({
  id: currentUser.id,
  displayName: currentUser.displayName,
  email: currentUser.email,
});
