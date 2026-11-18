import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquarePlus, Radio, X } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { resolveIsBot } from '../lib/bots';
import { queryKeys } from '../lib/queryKeys';
import { formatThreadTime } from '../lib/format';
import type { InboxConversation } from '../lib/types';
import { useAuth } from '../auth/AuthProvider';
import { useRail } from '../layouts/RailContext';
import { useRealtime } from '../realtime/RealtimeProvider';
import { BotBadge } from './BotBadge';
import { Monogram, PresenceDot } from './Monogram';
import { ConnectionStatus } from './ConnectionStatus';
import { LoadingRows } from './PageState';
import { PrivateWindowNote } from './PrivateWindowNote';
import { SignalMeter } from './SignalMeter';
import { Wordmark } from './Wordmark';

function activeConversationId(pathname: string): string | null {
  const match = /^\/c\/([^/]+)/.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function ConversationRow({
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
        isBot ? ', AI teammate' : ''
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
            label={`${conversation.displayName} is ${conversation.isOnline ? 'online' : 'offline'}`}
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
          <time className="conversation__time" dateTime={conversation.lastMessageCreatedAt ?? undefined}>
            {formatThreadTime(conversation.lastMessageCreatedAt)}
          </time>
        </span>
        <span className="conversation__bottom">
          <span className={`conversation__snippet ${hasMessage ? '' : 'is-quiet'}`.trim()}>
            {hasMessage ? conversation.lastMessageContent : 'No transmissions yet'}
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

export function ConversationRail() {
  const { user } = useAuth();
  const location = useLocation();
  const { drawerOpen, closeDrawer } = useRail();
  const { state: realtimeState } = useRealtime();
  const currentId = activeConversationId(location.pathname);
  const inbox = useQuery({
    queryKey: queryKeys.inbox,
    queryFn: () => api.getInbox(50),
    staleTime: 15_000,
  });

  const conversations = inbox.data?.conversations ?? [];
  const totalUnread = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);

  return (
    <aside
      className="rail"
      id="conversation-rail"
      aria-label="Channel rail"
      role={drawerOpen ? 'dialog' : undefined}
      aria-modal={drawerOpen ? true : undefined}
    >
      <header className="rail__masthead">
        <div className="rail__brand-row">
          <Link to="/inbox" className="rail__brand" onClick={closeDrawer} aria-label="Banter inbox">
            <Wordmark size="small" />
          </Link>
          <button
            type="button"
            className="icon-button rail__close"
            onClick={closeDrawer}
            aria-label="Close conversations"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="rail__desk">
          <span className="rail__desk-name">
            <span className={`rail__desk-pip is-${realtimeState}`} aria-hidden="true" />
            Night desk
          </span>
          <span className="rail__desk-meter">
            <SignalMeter state={realtimeState} bars={5} />
            <ConnectionStatus compact />
          </span>
        </div>
      </header>

      <div className="rail__toolbar">
        <Link to="/new" className="new-thread-button" onClick={closeDrawer}>
          <span className="new-thread-button__icon">
            <MessageSquarePlus size={17} aria-hidden="true" />
          </span>
          <span>New thread</span>
          <span className="new-thread-button__hint mono" aria-hidden="true">
            <Radio size={12} />
          </span>
        </Link>
      </div>

      <div className="rail__heading">
        <h2 className="mono">Channel index</h2>
        <span className="rail__heading-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="mono rail__count" role="status" aria-live="polite">
          {inbox.isSuccess && conversations.length > 0
            ? totalUnread > 0
              ? `${totalUnread} unread`
              : `${conversations.length} open`
            : 'desk'}
        </span>
      </div>

      <div className="rail__scroll">
        {inbox.isPending && <LoadingRows count={5} />}

        {inbox.isError && (
          <div className="rail__error" role="alert">
            <p className="mono">the desk did not load</p>
            <p>{errorMessage(inbox.error)}</p>
            <button type="button" className="text-button" onClick={() => void inbox.refetch()}>
              Try again
            </button>
          </div>
        )}

        {inbox.isSuccess && conversations.length === 0 && (
          <div className="rail__empty">
            <p className="mono">no channels yet</p>
            <h3>Start the first thread.</h3>
            <p>Search for a person and open a direct message, or gather a few people into a group.</p>
            <Link to="/new" className="button button--primary button--small" onClick={closeDrawer}>
              Find someone
            </Link>
          </div>
        )}

        {conversations.length > 0 && (
          <nav className="conversation-list" aria-label="Channels">
            {conversations.map((conversation, index) => (
              <ConversationRow
                key={conversation.conversationId}
                conversation={conversation}
                index={index}
                active={conversation.conversationId === currentId}
                onNavigate={closeDrawer}
              />
            ))}
          </nav>
        )}
      </div>

      <footer className="rail__footer">
        {user && (
          <Link to="/me" className="rail__account" onClick={closeDrawer} aria-label="Your session">
            <span className="rail__account-avatar">
              <Monogram name={user.displayName} src={user.profilePictureUrl} size="xs" />
              <PresenceDot online label="You are online" />
            </span>
            <span className="rail__account-text">
              <span className="rail__account-name">{user.displayName}</span>
              <span className="mono">operator seat</span>
            </span>
            <span className="rail__account-signal" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </Link>
        )}
        <PrivateWindowNote compact />
      </footer>
    </aside>
  );
}
