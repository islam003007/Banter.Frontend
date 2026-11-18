import type {
  ChatMessage,
  ConversationDetail,
  ConversationParticipant,
  CurrentUser,
  DemoUser,
  InboxConversation,
  InboxPage,
  MessagesPage,
  UserSearchPage,
  UserSearchResult,
} from './types';

const API_PREFIX = '/api/v1';

type JsonRecord = Record<string, unknown>;

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, title: string, detail: string, fieldErrors: Record<string, string> = {}) {
    super(detail || title || 'The request failed.');
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.detail || error.title || 'The request failed.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Try again.';
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function number(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function boolean(value: unknown): boolean {
  return value === true;
}

function optionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === 'true') return true;
  if (value === 0 || value === 'false') return false;
  return undefined;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringList(value: unknown): string[] {
  return list(value).filter((item): item is string => typeof item === 'string');
}

async function readProblem(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const problem = record(body);
  const title = text(problem.title) ?? response.statusText ?? 'Request failed';
  let detail = text(problem.detail) ?? text(problem.message) ?? title;
  const fieldErrors: Record<string, string> = {};

  const errors = problem.errors;
  if (Array.isArray(errors)) {
    const descriptions = errors
      .map((entry) => (typeof entry === 'string' ? entry : text(record(entry).description) ?? text(record(entry).message)))
      .filter((entry): entry is string => Boolean(entry));
    if (descriptions.length > 0) detail = descriptions.join(' ');
  } else if (isRecord(errors)) {
    for (const [field, value] of Object.entries(errors)) {
      const message = Array.isArray(value)
        ? value.map(String).join(' ')
        : typeof value === 'string'
          ? value
          : text(record(value).description) ?? '';
      if (message) fieldErrors[field] = message;
    }
    const first = Object.values(fieldErrors)[0];
    if (first && detail === title) detail = first;
  }

  return new ApiError(response.status, title, detail, fieldErrors);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, 'Network unavailable', 'Banter did not answer. Check your connection and try again.');
  }

  if (response.status === 401) {
    throw await readProblem(response);
  }

  if (!response.ok) {
    throw await readProblem(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  if (!raw) return undefined as T;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError(response.status, 'Unexpected response', 'The desk returned something the app could not read.');
  }
}

function normalizeCurrentUser(value: unknown): CurrentUser {
  const source = record(record(value).user ?? value);
  return {
    id: text(source.id) ?? text(source.userId) ?? '',
    email: text(source.email) ?? '',
    displayName: text(source.displayName) ?? text(source.name) ?? 'You',
    profilePictureUrl: text(source.profilePictureUrl) ?? text(source.profilePicture) ?? null,
  };
}

function normalizeDemoUser(value: unknown): DemoUser {
  const source = record(value);
  return {
    id: text(source.id) ?? text(source.userId) ?? '',
    email: text(source.email) ?? '',
    displayName: text(source.displayName) ?? text(source.name) ?? 'Demo user',
    profilePictureUrl: text(source.profilePictureUrl) ?? text(source.profilePicture) ?? null,
  };
}

function normalizeInboxConversation(value: unknown): InboxConversation {
  const source = record(value);
  const lastMessage = record(source.lastMessage);
  return {
    conversationId: text(source.conversationId) ?? text(source.id) ?? '',
    displayName:
      text(source.displayName) ?? text(source.title) ?? text(lastMessage.senderDisplayName) ?? 'Conversation',
    profilePictures: stringList(source.profilePictures ?? source.profilePictureUrls),
    lastMessageContent: text(source.lastMessageContent) ?? text(lastMessage.content),
    lastMessageCreatedAt: text(source.lastMessageCreatedAt) ?? text(lastMessage.createdAt),
    isGroup: boolean(source.isGroup),
    isOnline: boolean(source.isOnline),
    isBot: optionalBoolean(source.isBot ?? source.isBotConversation ?? source.participantIsBot),
    unreadCount: number(source.unreadCount) ?? number(source.unread) ?? 0,
  };
}

function normalizeParticipant(value: unknown): ConversationParticipant {
  const source = record(value);
  return {
    userId: text(source.userId) ?? text(source.id) ?? '',
    displayName: text(source.displayName) ?? text(source.name) ?? 'Participant',
    profilePictureUrl: text(source.profilePictureUrl) ?? text(source.profilePicture) ?? null,
    isOnline: boolean(source.isOnline ?? source.online),
    isBot: optionalBoolean(source.isBot ?? source.isBotUser ?? source.bot),
  };
}

function normalizeChatMessage(value: unknown): ChatMessage {
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

function normalizeSearchUser(value: unknown): UserSearchResult {
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

function normalizeId(value: unknown): string {
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

function normalizeInbox(value: unknown): InboxPage {
  const source = record(value);
  const conversations = list(source.conversations ?? source.items).map(normalizeInboxConversation);
  return {
    conversations,
    nextCursor: text(source.nextCursor) ?? text(source.nextcursor),
    hasMore: boolean(source.hasMore),
  };
}

function normalizeMessages(value: unknown): MessagesPage {
  const source = record(value);
  return {
    messages: list(source.messages ?? source.items).map(normalizeChatMessage),
    nextCursor: text(source.nextCursor) ?? text(source.nextcursor),
    hasMore: boolean(source.hasMore),
    lastSeenMessageId: text(source.lastSeenMessageId),
  };
}

function normalizeDetail(value: unknown, conversationId: string): ConversationDetail {
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

export const api = {
  async getSession(): Promise<CurrentUser | null> {
    try {
      const value = await request<unknown>('/auth/me');
      return normalizeCurrentUser(value);
    } catch (error) {
      if (isUnauthorized(error)) return null;
      throw error;
    }
  },

  async getDemoUsers(): Promise<DemoUser[]> {
    const value = await request<unknown>('/auth/demo-users');
    const source = record(value);
    return list(source.users ?? source.demoUsers ?? source.items ?? value).map(normalizeDemoUser);
  },

  demoLogin(userId: string): Promise<void> {
    return request<void>('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  login(email: string, password: string): Promise<void> {
    return request<void>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register(input: {
    email: string;
    displayName: string;
    password: string;
    passwordConfirm: string;
  }): Promise<string> {
    return request<unknown>('/users/register', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        displayName: input.displayName,
        profilePictureUrl: null,
        password: input.password,
        passwordConfirm: input.passwordConfirm,
      }),
    }).then(normalizeId);
  },

  logout(): Promise<void> {
    return request<void>('/auth/logout', { method: 'POST' });
  },

  async getInbox(pageSize = 50): Promise<InboxPage> {
    const value = await request<unknown>(`/conversations?pageSize=${pageSize}`);
    return normalizeInbox(value);
  },

  async getConversation(conversationId: string): Promise<ConversationDetail> {
    const value = await request<unknown>(`/conversations/${encodeURIComponent(conversationId)}`);
    return normalizeDetail(value, conversationId);
  },

  async getMessages(conversationId: string, cursor: string | null, pageSize = 30): Promise<MessagesPage> {
    const params = new URLSearchParams({ pageSize: String(pageSize) });
    if (cursor) params.set('cursor', cursor);
    const value = await request<unknown>(
      `/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`,
    );
    return normalizeMessages(value);
  },

  async sendMessage(conversationId: string, content: string): Promise<string> {
    const value = await request<unknown>(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return normalizeId(value);
  },

  markAsRead(conversationId: string): Promise<void> {
    return request<void>(`/conversations/${encodeURIComponent(conversationId)}/mark-as-read`, {
      method: 'POST',
    });
  },

  leaveConversation(conversationId: string): Promise<void> {
    return request<void>(`/conversations/${encodeURIComponent(conversationId)}/participants/me`, {
      method: 'DELETE',
    });
  },

  async createConversation(participantIds: string[], groupTitle: string | null): Promise<string> {
    const value = await request<unknown>('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        participantsIds: participantIds,
        groupTitle,
      }),
    });
    return normalizeId(value);
  },

  async searchUsers(searchTerm: string, cursor: string | null, pageSize = 20): Promise<UserSearchPage> {
    const params = new URLSearchParams({
      searchTerm,
      pageSize: String(pageSize),
    });
    if (cursor) params.set('cursor', cursor);
    const value = await request<unknown>(`/users/search?${params.toString()}`);
    const source = record(value);
    return {
      users: list(source.users ?? source.items ?? value).map(normalizeSearchUser),
      nextCursor: text(source.nextCursor) ?? text(source.nextcursor),
      hasMore: boolean(source.hasMore),
    };
  },
};
