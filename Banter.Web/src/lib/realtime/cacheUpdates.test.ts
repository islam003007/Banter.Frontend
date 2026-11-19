import { describe, expect, it } from 'vitest';
import {
  applyIncomingMessage,
  hasConversation,
  markConversationRead,
  prependMessage,
  removeMessage,
  replaceMessageId,
  sortConversationsByActivity,
  updateInboxAfterSend,
  type MessagePages,
} from './cacheUpdates';
import { makeConversation, makeInbox, makeMessage } from '../../test/fixtures';
import type { MessageNotification } from '../api/contracts';

function pages(messages = [makeMessage()]): MessagePages {
  return {
    pages: [{ messages, nextCursor: null, hasMore: false, lastSeenMessageId: null }],
    pageParams: [null],
  };
}

describe('realtime cache updates', () => {
  it('prepends a new message to the newest page', () => {
    const existing = makeMessage({ id: 'm1' });
    const incoming = makeMessage({ id: 'm2' });
    const current = pages([existing]);
    const next = prependMessage(current, incoming);
    expect(next?.pages[0].messages.map((message) => message.id)).toEqual(['m2', 'm1']);
  });

  it('does not duplicate an already-received message', () => {
    const existing = makeMessage({ id: 'm1' });
    const current = pages([existing]);
    expect(prependMessage(current, existing)).toBe(current);
  });

  it('replaces an optimistic id and removes failed messages', () => {
    const current = pages([makeMessage({ id: 'pending-1' })]);
    const replaced = replaceMessageId(current, 'pending-1', 'server-1');
    expect(replaced?.pages[0].messages[0].id).toBe('server-1');
    expect(removeMessage(replaced, 'server-1')?.pages[0].messages).toEqual([]);
  });

  it('updates and reorders the inbox after an optimistic send', () => {
    const older = makeConversation({
      conversationId: 'older',
      lastMessageCreatedAt: '2026-05-28T10:00:00.000Z',
    });
    const target = makeConversation({
      conversationId: 'target',
      unreadCount: 4,
      lastMessageCreatedAt: '2026-05-27T10:00:00.000Z',
    });
    const inbox = makeInbox([older, target]);

    const next = updateInboxAfterSend(
      inbox,
      'target',
      'new line',
      '2026-05-29T10:00:00.000Z',
    );

    expect(next?.conversations.map((conversation) => conversation.conversationId)).toEqual([
      'target',
      'older',
    ]);
    expect(next?.conversations[0]).toMatchObject({
      lastMessageContent: 'new line',
      unreadCount: 0,
    });
  });

  it('increments unread for inactive conversations and clears it when active', () => {
    const target = makeConversation({ conversationId: 'target', unreadCount: 2 });
    const other = makeConversation({ conversationId: 'other' });
    const notification: MessageNotification = {
      ...makeMessage({ id: 'm2', userId: 'user-mohamed' }),
      conversationId: 'target',
    };

    const inactive = applyIncomingMessage(makeInbox([target, other]), notification, {
      isActive: false,
      currentUserId: 'user-ahmed',
    });
    expect(inactive?.conversations.find((item) => item.conversationId === 'target')?.unreadCount).toBe(3);

    const active = applyIncomingMessage(makeInbox([target, other]), notification, {
      isActive: true,
      currentUserId: 'user-ahmed',
    });
    expect(active?.conversations.find((item) => item.conversationId === 'target')?.unreadCount).toBe(0);
  });

  it('does not increment unread for your own message', () => {
    const target = makeConversation({ conversationId: 'target', unreadCount: 2 });
    const notification: MessageNotification = {
      ...makeMessage({ id: 'm3', userId: 'user-ahmed' }),
      conversationId: 'target',
    };
    const next = applyIncomingMessage(makeInbox([target]), notification, {
      isActive: false,
      currentUserId: 'user-ahmed',
    });
    expect(next?.conversations[0].unreadCount).toBe(0);
  });

  it('sorts by activity, clears unread, and detects known conversations', () => {
    const one = makeConversation({
      conversationId: 'one',
      lastMessageCreatedAt: '2026-05-27T10:00:00.000Z',
    });
    const two = makeConversation({
      conversationId: 'two',
      lastMessageCreatedAt: '2026-05-29T10:00:00.000Z',
    });
    const inbox = makeInbox([one, two]);

    expect(sortConversationsByActivity([one, two]).map((item) => item.conversationId)).toEqual([
      'two',
      'one',
    ]);
    expect(markConversationRead(inbox, 'one')?.conversations[0].unreadCount).toBe(0);
    expect(hasConversation(inbox, 'two')).toBe(true);
    expect(hasConversation(inbox, 'missing')).toBe(false);
  });

  it('leaves missing caches untouched', () => {
    expect(updateInboxAfterSend(undefined, 'c', 'x', '2026-01-01')).toBeUndefined();
    expect(markConversationRead(undefined, 'c')).toBeUndefined();
    expect(applyIncomingMessage(undefined, {} as MessageNotification, {
      isActive: false,
      currentUserId: 'u',
    })).toBeUndefined();
    expect(prependMessage(undefined, makeMessage())).toBeUndefined();
  });
});
