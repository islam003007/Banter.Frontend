import { Link } from 'react-router-dom';
import type { InboxConversation } from '../../../lib/api/contracts';
import { resolveIsBot } from '../../../lib/bots';
import { formatThreadTime } from '../../../lib/format';
import { BotBadge } from '../../../components/ui/BotBadge';
import { Monogram, PresenceDot } from '../../../components/ui/Monogram';

export function ChannelRow({
  conversation,
  index,
  active,
  onNavigate,
}: {
  conversation: InboxConversation;
  index: number;
  active: boolean;
  onNavigate: () => void;
}) {
  const unread = active ? 0 : conversation.unreadCount;
  const hasMessage = Boolean(conversation.lastMessageContent);
  const isBot = !conversation.isGroup && resolveIsBot(conversation.isBot, conversation.displayName);

  return (
    <Link
      to={`/c/${conversation.conversationId}`}
      className={`conversation ${active ? 'is-active' : ''} ${
        unread > 0 ? 'has-unread' : ''
      } ${conversation.isGroup ? 'is-group' : ''} ${isBot ? 'is-bot' : ''}`.trim()}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={`${conversation.displayName}${conversation.isGroup ? ', group channel' : ''}${
        isBot ? ', AI operator' : ''
      }${unread > 0 ? `, ${unread} unread` : ''}${
        !isBot && conversation.isOnline ? ', online' : ''
      }`}
    >
      <span className="conversation__index mono" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="conversation__avatar">
        <Monogram
          name={conversation.displayName}
          src={conversation.profilePictures[0]}
          group={conversation.isGroup}
          size="md"
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
          <span className="conversation__bot-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        )}
      </span>
      <span className="conversation__body">
        <span className="conversation__top">
          <span className="conversation__name-row">
            <span className="conversation__name">{conversation.displayName}</span>
            {isBot && <BotBadge />}
            {conversation.isGroup && (
              <span className="conversation__kind mono" aria-hidden="true">
                group
              </span>
            )}
          </span>
          <time
            className="conversation__time"
            dateTime={conversation.lastMessageCreatedAt ?? undefined}
          >
            {formatThreadTime(conversation.lastMessageCreatedAt)}
          </time>
        </span>
        <span className="conversation__bottom">
          <span className={`conversation__snippet ${hasMessage ? '' : 'is-quiet'}`.trim()}>
            {hasMessage ? conversation.lastMessageContent : 'No messages yet'}
          </span>
          {unread > 0 ? (
            <span className="unread-count" aria-label={`${unread} unread`}>
              {unread > 99 ? '99+' : unread}
            </span>
          ) : (
            active && (
              <span className="conversation__wave" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
            )
          )}
        </span>
      </span>
    </Link>
  );
}
