import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { InboxConversation } from '../../../lib/api/contracts';
import { resolveIsBot } from '../../../lib/bots';
import { formatThreadTime } from '../../../lib/format';
import { BotBadge } from '../../../components/ui/BotBadge';
import { Monogram, PresenceDot } from '../../../components/ui/Monogram';
import { unreadLabel } from '../model/inboxSummary';

export function ThreadCard({
  conversation,
  index,
}: {
  conversation: InboxConversation;
  index: number;
}) {
  const isBot = !conversation.isGroup && resolveIsBot(conversation.isBot, conversation.displayName);
  const online = !conversation.isGroup && !isBot && conversation.isOnline;
  const hasMessage = Boolean(conversation.lastMessageContent);
  const time = formatThreadTime(conversation.lastMessageCreatedAt);
  const channel = String(index + 1).padStart(2, '0');
  const kind = conversation.isGroup
    ? 'group channel'
    : isBot
      ? 'AI operator'
      : online
        ? 'online now'
        : 'direct channel';

  return (
    <Link
      to={`/c/${conversation.conversationId}`}
      className={`welcome-thread ${conversation.isGroup ? 'welcome-thread--group' : ''} ${
        isBot ? 'welcome-thread--bot' : ''
      }`.trim()}
      aria-label={`channel ${channel}, ${conversation.displayName}, ${kind}${
        conversation.unreadCount > 0 ? `, ${conversation.unreadCount} unread` : ''
      }${online ? ', online' : ''} — open channel`}
    >
      <span className="welcome-thread__top">
        <span className="welcome-thread__avatar">
          <Monogram
            name={conversation.displayName}
            src={conversation.profilePictures[0]}
            group={conversation.isGroup}
            size="sm"
          />
          {!conversation.isGroup && !isBot && (
            <PresenceDot
              online={conversation.isOnline}
              label={`${conversation.displayName} is ${
                conversation.isOnline ? 'online' : 'offline'
              }`}
            />
          )}
          {isBot && (
            <span className="welcome-thread__bot-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          )}
        </span>
        <span className="welcome-thread__who">
          <span className="welcome-thread__name-row">
            <span className="welcome-thread__name">{conversation.displayName}</span>
            {isBot && <BotBadge />}
          </span>
          <span className="welcome-thread__meta mono">
            {kind}
            {time && <span aria-hidden="true"> · {time}</span>}
          </span>
        </span>
        {conversation.unreadCount > 0 && (
          <span className="unread-count" aria-label={`${conversation.unreadCount} unread`}>
            {unreadLabel(conversation.unreadCount)}
          </span>
        )}
      </span>
      <span className={`welcome-thread__snippet ${hasMessage ? '' : 'is-quiet'}`.trim()}>
        {hasMessage
          ? conversation.lastMessageContent
          : 'No transmissions yet — open the channel to start it.'}
      </span>
      <span className="welcome-thread__foot mono">
        <span>
          channel {channel} · {hasMessage ? 'latest transmission' : 'quiet channel'}
        </span>
        <span className="welcome-thread__open">
          <span className="welcome-thread__wave" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          open
          <ArrowRight size={12} aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
