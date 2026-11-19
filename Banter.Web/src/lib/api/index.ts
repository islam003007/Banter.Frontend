import type {
  ConversationDetail,
  CurrentUser,
  DemoUser,
  InboxPage,
  MessagesPage,
  UserSearchPage,
} from './contracts';
import { isUnauthorized } from './errors';
import {
  normalizeCurrentUser,
  normalizeDemoUser,
  normalizeDetail,
  normalizeId,
  normalizeInbox,
  normalizeMessages,
  normalizeSearchUser,
} from './normalizers';
import { boolean, list, record, text } from './parsing';
import { request } from './transport';

export { API_PREFIX, request } from './transport';
export { ApiError, errorMessage, isUnauthorized } from './errors';
export type * from './contracts';

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

  async getMessages(
    conversationId: string,
    cursor: string | null,
    pageSize = 30,
  ): Promise<MessagesPage> {
    const params = new URLSearchParams({ pageSize: String(pageSize) });
    if (cursor) params.set('cursor', cursor);
    const value = await request<unknown>(
      `/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`,
    );
    return normalizeMessages(value);
  },

  async sendMessage(conversationId: string, content: string): Promise<string> {
    const value = await request<unknown>(
      `/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
    );
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

  async searchUsers(
    searchTerm: string,
    cursor: string | null,
    pageSize = 20,
  ): Promise<UserSearchPage> {
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
