import { describe, expect, it } from 'vitest';
import {
  normalizeChatMessage,
  normalizeCurrentUser,
  normalizeDemoUser,
  normalizeDetail,
  normalizeId,
  normalizeInbox,
  normalizeInboxConversation,
  normalizeMessages,
  normalizeParticipant,
  normalizeSearchUser,
} from './normalizers';

describe('API normalizers', () => {
  it('normalizes a current user from either a wrapper or a flat payload', () => {
    expect(
      normalizeCurrentUser({
        user: { userId: 'u1', email: 'a@b.c', name: 'Ahmed', profilePicture: '/a.png' },
      }),
    ).toEqual({
      id: 'u1',
      email: 'a@b.c',
      displayName: 'Ahmed',
      profilePictureUrl: '/a.png',
    });
    expect(normalizeCurrentUser({ id: 'u2' }).displayName).toBe('You');
  });

  it('normalizes demo users with fallbacks', () => {
    expect(normalizeDemoUser({ id: 'd1', displayName: 'Sara' })).toEqual({
      id: 'd1',
      email: '',
      displayName: 'Sara',
      profilePictureUrl: null,
    });
  });

  it('normalizes inbox conversations, including nested last messages', () => {
    expect(
      normalizeInboxConversation({
        conversationId: 'c1',
        title: 'Design Crit',
        profilePictureUrls: ['/one.png', 42, '/two.png'],
        lastMessage: { senderDisplayName: 'Ada', content: 'ship it', createdAt: '2026-05-01' },
        isGroup: true,
        unread: '3',
        participantIsBot: 'true',
      }),
    ).toEqual({
      conversationId: 'c1',
      displayName: 'Design Crit',
      profilePictures: ['/one.png', '/two.png'],
      lastMessageContent: 'ship it',
      lastMessageCreatedAt: '2026-05-01',
      isGroup: true,
      isOnline: false,
      isBot: true,
      unreadCount: 3,
    });
  });

  it('normalizes participants and chat messages with alias fields', () => {
    expect(
      normalizeParticipant({
        id: 'p1',
        name: 'Milo',
        online: true,
        isBotUser: false,
      }),
    ).toEqual({
      userId: 'p1',
      displayName: 'Milo',
      profilePictureUrl: null,
      isOnline: true,
      isBot: false,
    });

    expect(
      normalizeChatMessage({
        messageId: 'm1',
        content: 'hello',
        senderId: 'u1',
        senderDisplayName: 'Ahmed',
        senderIsBot: true,
      }),
    ).toMatchObject({
      id: 'm1',
      content: 'hello',
      userId: 'u1',
      displayName: 'Ahmed',
      isBot: true,
    });
  });

  it('normalizes search results and their bot persona', () => {
    expect(
      normalizeSearchUser({
        userId: 'b1',
        name: 'Nova',
        isBotUser: true,
        persona: 'Idea generator',
        online: 1,
      }),
    ).toEqual({
      id: 'b1',
      displayName: 'Nova',
      email: '',
      profilePictureUrl: null,
      isOnline: false,
      isBot: true,
      botPersona: 'Idea generator',
    });
  });

  it('normalizes inbox and message pages', () => {
    expect(
      normalizeInbox({
        items: [{ id: 'c1', title: 'One' }],
        nextcursor: 'cursor-1',
        hasMore: true,
      }),
    ).toMatchObject({
      conversations: [{ conversationId: 'c1', displayName: 'One' }],
      nextCursor: 'cursor-1',
      hasMore: true,
    });

    expect(
      normalizeMessages({
        messages: [{ id: 'm1' }],
        nextCursor: 'older',
        hasMore: true,
        lastSeenMessageId: 'm1',
      }),
    ).toMatchObject({
      messages: [{ id: 'm1' }],
      nextCursor: 'older',
      hasMore: true,
      lastSeenMessageId: 'm1',
    });
  });

  it('normalizes conversation detail wrappers and participants', () => {
    expect(
      normalizeDetail(
        {
          conversation: {
            id: 'c9',
            title: 'Launch Room',
            isGroup: true,
            isBotConversation: false,
            members: [{ id: 'u1', name: 'Ahmed' }],
          },
        },
        'fallback',
      ),
    ).toEqual({
      conversationId: 'c9',
      title: 'Launch Room',
      displayName: 'Launch Room',
      isGroup: true,
      isBot: false,
      participants: [
        {
          userId: 'u1',
          displayName: 'Ahmed',
          profilePictureUrl: null,
          isOnline: false,
          isBot: undefined,
        },
      ],
    });
  });

  it('normalizes ids from strings, JSON strings, and objects', () => {
    expect(normalizeId('abc')).toBe('abc');
    expect(normalizeId('"abc"')).toBe('abc');
    expect(normalizeId({ conversationId: 'c1' })).toBe('c1');
    expect(normalizeId({})).toBe('');
  });
});
