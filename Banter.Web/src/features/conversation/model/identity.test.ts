import { describe, expect, it } from 'vitest';
import { makeDetail, mohamedConversation } from '../../../test/fixtures';
import {
  channelDetail,
  channelKind,
  resolveConversationIdentity,
} from './identity';

describe('conversation identity', () => {
  it('resolves a direct conversation from the API detail', () => {
    const identity = resolveConversationIdentity({
      detail: makeDetail(),
      fallback: mohamedConversation,
      currentUserId: 'user-ahmed',
    });

    expect(identity.title).toBe('Mohamed');
    expect(identity.isGroup).toBe(false);
    expect(identity.online).toBe(false);
    expect(identity.onlineCount).toBe(1);
    expect(identity.isBotConversation).toBe(false);
    expect(channelKind(identity)).toBe('direct channel');
    expect(channelDetail(identity, null)).toBe('direct channel · away');
  });

  it('falls back to the inbox row and seeded bot names', () => {
    const identity = resolveConversationIdentity({
      fallback: {
        ...mohamedConversation,
        displayName: 'Ada',
        isBot: undefined,
        isOnline: true,
      },
      currentUserId: 'user-ahmed',
    });

    expect(identity.title).toBe('Ada');
    expect(identity.isBotConversation).toBe(true);
    expect(channelKind(identity)).toBe('AI operator');
    expect(channelDetail(identity, 'Ada')).toBe('Ada is typing…');
  });

  it('uses the group title and counts non-bot participants', () => {
    const detail = makeDetail({
      displayName: 'Design Crit',
      title: 'Design Crit',
      isGroup: true,
      participants: [
        { userId: 'u1', displayName: 'Ahmed', profilePictureUrl: null, isOnline: true },
        { userId: 'u2', displayName: 'Mohamed', profilePictureUrl: null, isOnline: true },
        {
          userId: 'bot-ada',
          displayName: 'Ada',
          profilePictureUrl: null,
          isOnline: true,
          isBot: true,
        },
      ],
    });
    const identity = resolveConversationIdentity({
      detail,
      currentUserId: 'u1',
    });

    expect(identity.title).toBe('Design Crit');
    expect(identity.onlineCount).toBe(2);
    expect(channelKind(identity)).toBe('group channel');
    expect(channelDetail(identity, null)).toBe('3 in channel · 2 online');
  });
});
