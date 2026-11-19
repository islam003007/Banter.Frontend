import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '../../../lib/api/contracts';
import {
  flattenMessages,
  groupMessages,
  isPendingMessage,
  latestRealMessage,
} from './timeline';

function message(overrides: Partial<ChatMessage> & { id: string; createdAt: string }): ChatMessage {
  return {
    content: overrides.id,
    userId: 'user-1',
    displayName: 'Ahmed',
    profilePictureUrl: null,
    ...overrides,
  };
}

describe('chat timeline', () => {
  it('flattens pages, removes duplicate ids, and sorts oldest first', () => {
    const a = message({ id: 'a', createdAt: '2026-05-29T10:00:00.000Z' });
    const b = message({ id: 'b', createdAt: '2026-05-29T10:02:00.000Z' });
    const c = message({ id: 'c', createdAt: '2026-05-29T10:01:00.000Z' });
    const pages = [
      { messages: [b, a], nextCursor: 'x', hasMore: true, lastSeenMessageId: null },
      { messages: [c, a], nextCursor: null, hasMore: false, lastSeenMessageId: null },
    ];

    expect(flattenMessages(pages).map((item) => item.id)).toEqual(['a', 'c', 'b']);
    expect(flattenMessages(undefined)).toEqual([]);
  });

  it('orders equal timestamps by id for a stable render', () => {
    const b = message({ id: 'b', createdAt: '2026-05-29T10:00:00.000Z' });
    const a = message({ id: 'a', createdAt: '2026-05-29T10:00:00.000Z' });
    expect(
      flattenMessages([
        { messages: [b, a], nextCursor: null, hasMore: false, lastSeenMessageId: null },
      ]).map((item) => item.id),
    ).toEqual(['a', 'b']);
  });

  it('inserts day dividers and marks continuations within five minutes', () => {
    const first = message({
      id: 'm1',
      userId: 'u1',
      createdAt: new Date(2026, 4, 28, 9, 0).toISOString(),
    });
    const continuation = message({
      id: 'm2',
      userId: 'u1',
      createdAt: new Date(2026, 4, 28, 9, 4).toISOString(),
    });
    const later = message({
      id: 'm3',
      userId: 'u1',
      createdAt: new Date(2026, 4, 28, 9, 20).toISOString(),
    });
    const newDay = message({
      id: 'm4',
      userId: 'u2',
      createdAt: new Date(2026, 4, 29, 10, 0).toISOString(),
    });

    const nodes = groupMessages([first, continuation, later, newDay]);

    expect(nodes.filter((node) => node.type === 'day')).toHaveLength(2);
    const messageNodes = nodes.filter((node) => node.type === 'message');
    expect(messageNodes).toHaveLength(4);
    expect(messageNodes[0]).toMatchObject({ continuation: false });
    expect(messageNodes[1]).toMatchObject({ continuation: true });
    expect(messageNodes[2]).toMatchObject({ continuation: false });
    expect(messageNodes[3]).toMatchObject({ continuation: false });
  });

  it('resets continuation when the author changes', () => {
    const one = message({ id: 'm1', userId: 'u1', createdAt: '2026-05-29T10:00:00.000Z' });
    const two = message({ id: 'm2', userId: 'u2', createdAt: '2026-05-29T10:01:00.000Z' });
    const nodes = groupMessages([one, two]);
    expect(nodes.filter((node) => node.type === 'message')[1]).toMatchObject({
      continuation: false,
    });
  });

  it('finds the latest delivered message and ignores optimistic rows', () => {
    const real = message({ id: 'real', createdAt: '2026-05-29T10:00:00.000Z' });
    const pending = message({ id: 'pending-1', createdAt: '2026-05-29T10:01:00.000Z' });
    expect(latestRealMessage([real, pending])?.id).toBe('real');
    expect(isPendingMessage(pending)).toBe(true);
    expect(isPendingMessage(real)).toBe(false);
  });
});
