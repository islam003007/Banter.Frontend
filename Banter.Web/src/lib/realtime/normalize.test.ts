import { describe, expect, it } from 'vitest';
import {
  conversationIdFromPath,
  normalizeBotTyping,
  normalizeNotification,
  toChatMessage,
} from './normalize';

describe('realtime normalization', () => {
  it('normalizes a message notification with sender aliases', () => {
    expect(
      normalizeNotification({
        id: 'm1',
        conversationId: 'c1',
        content: 'hello',
        userId: 'u1',
        senderDisplayName: 'Sara',
        senderProfilePictureUrl: '/sara.png',
        senderIsBot: true,
        createdAt: '2026-05-29T10:00:00.000Z',
      }),
    ).toEqual({
      id: 'm1',
      conversationId: 'c1',
      content: 'hello',
      userId: 'u1',
      displayName: 'Sara',
      profilePictureUrl: '/sara.png',
      isBot: true,
      createdAt: '2026-05-29T10:00:00.000Z',
    });
  });

  it('rejects notifications without an id or conversation', () => {
    expect(normalizeNotification({ id: 'm1' })).toBeNull();
    expect(normalizeNotification({ conversationId: 'c1' })).toBeNull();
    expect(normalizeNotification(null)).toBeNull();
  });

  it('normalizes string and object bot typing signals', () => {
    expect(normalizeBotTyping('c1', 'Ada')).toEqual({
      conversationId: 'c1',
      botName: 'Ada',
      active: true,
    });
    expect(normalizeBotTyping('c1')).toEqual({
      conversationId: 'c1',
      botName: 'AI teammate',
      active: true,
    });
    expect(
      normalizeBotTyping({ conversationId: 'c2', botDisplayName: 'Milo', isTyping: false }),
    ).toEqual({
      conversationId: 'c2',
      botName: 'Milo',
      active: false,
    });
    expect(normalizeBotTyping({ botName: 'Ada' })).toBeNull();
  });

  it('extracts and decodes conversation ids from chat paths', () => {
    expect(conversationIdFromPath('/c/conv-1')).toBe('conv-1');
    expect(conversationIdFromPath('/c/conv%201')).toBe('conv 1');
    expect(conversationIdFromPath('/c/bad%')).toBe('bad%');
    expect(conversationIdFromPath('/inbox')).toBeNull();
  });

  it('converts a notification into a chat message', () => {
    const message = toChatMessage({
      id: 'm1',
      conversationId: 'c1',
      content: 'hi',
      userId: 'u1',
      displayName: 'Sara',
      profilePictureUrl: null,
      isBot: false,
      createdAt: '2026-05-29T10:00:00.000Z',
    });
    expect(message).not.toHaveProperty('conversationId');
    expect(message.id).toBe('m1');
  });
});
