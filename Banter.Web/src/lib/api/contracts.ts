export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  profilePictureUrl: string | null;
}

export interface DemoUser {
  id: string;
  email: string;
  displayName: string;
  profilePictureUrl: string | null;
}

export interface InboxConversation {
  conversationId: string;
  displayName: string;
  profilePictures: string[];
  lastMessageContent: string | null;
  lastMessageCreatedAt: string | null;
  isGroup: boolean;
  isOnline: boolean;
  isBot?: boolean;
  unreadCount: number;
}

export interface InboxPage {
  conversations: InboxConversation[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ConversationParticipant {
  userId: string;
  displayName: string;
  profilePictureUrl: string | null;
  isOnline: boolean;
  isBot?: boolean;
}

export interface ConversationDetail {
  conversationId: string;
  title: string | null;
  displayName: string;
  isGroup: boolean;
  isBot?: boolean;
  participants: ConversationParticipant[];
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  displayName: string;
  profilePictureUrl: string | null;
  isBot?: boolean;
}

export interface MessagesPage {
  messages: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
  lastSeenMessageId: string | null;
}

export interface UserSearchResult {
  id: string;
  displayName: string;
  email: string;
  profilePictureUrl: string | null;
  isOnline: boolean;
  isBot?: boolean;
  botPersona?: string | null;
}

export interface UserSearchPage {
  users: UserSearchResult[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface MessageNotification extends ChatMessage {
  conversationId: string;
}

export interface BotTypingNotification {
  conversationId: string;
  botName: string;
}

export type RealtimeState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
