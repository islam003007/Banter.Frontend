import { describe, expect, it } from 'vitest';
import { adaConversation, designGroup, mohamedConversation } from '../../../test/fixtures';
import { buildInboxSummary, greeting, padCount, unreadLabel } from './inboxSummary';

describe('inbox summary', () => {
  it('sorts by latest activity and derives the welcome metrics', () => {
    const summary = buildInboxSummary([
      { ...mohamedConversation, unreadCount: 2, isOnline: true },
      adaConversation,
      designGroup,
    ]);

    expect(summary.activeThreads.map((conversation) => conversation.conversationId)).toEqual([
      'conv-mohamed',
      'conv-ada',
      'conv-design',
    ]);
    expect(summary.latest?.conversationId).toBe('conv-mohamed');
    expect(summary.pickupThreads).toHaveLength(3);
    expect(summary.unreadTotal).toBe(3);
    expect(summary.liveNow).toBe(1);
    expect(summary.botThreads.get('ada')?.conversationId).toBe('conv-ada');
    expect(summary.botThreads.has('mohamed')).toBe(false);
  });

  it('does not count group or bot rows as live', () => {
    const summary = buildInboxSummary([
      { ...designGroup, isOnline: true },
      { ...adaConversation, isOnline: true },
    ]);
    expect(summary.liveNow).toBe(0);
    expect(summary.botThreads.size).toBe(1);
  });

  it('formats unread counts and the greeting by hour', () => {
    expect(unreadLabel(7)).toBe('7');
    expect(unreadLabel(120)).toBe('99+');
    expect(padCount(0)).toBe('00');
    expect(padCount(7)).toBe('07');
    expect(greeting(new Date(2026, 4, 29, 3))).toBe('Still up');
    expect(greeting(new Date(2026, 4, 29, 9))).toBe('Good morning');
    expect(greeting(new Date(2026, 4, 29, 15))).toBe('Good afternoon');
    expect(greeting(new Date(2026, 4, 29, 21))).toBe('Good evening');
  });
});
