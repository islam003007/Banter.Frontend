import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquarePlus, Search, X } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { resolveIsBot } from '../lib/bots';
import { queryKeys } from '../lib/queryKeys';
import { formatThreadTime } from '../lib/format';
import { commandKeyLabel } from '../lib/shortcut';
import type { InboxConversation } from '../lib/types';
import { useAuth } from '../auth/AuthProvider';
import { BotBadge } from './BotBadge';
import { Monogram, PresenceDot } from './Monogram';
import { LoadingRows } from './PageState';
import { PrivateWindowNote } from './PrivateWindowNote';
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
  active,
  onNavigate,
}: {
  conversation: InboxConversation;
  active: boolean;
  onNavigate: () => void;
}) {
  const unread = active ? 0 : conversation.unreadCount;
  const hasMessage = Boolean(conversation.lastMessageContent);
  const isBot = !conversation.isGroup && resolveIsBot(conversation.isBot, conversation.displayName);

  return (
    <Link
      to={`/c/${conversation.conversationId}`}
      className={`conversation ${active ? 'is-active' : ''} ${unread > 0 ? 'has-unread' : ''}`.trim()}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={`${conversation.displayName}${isBot ? ', AI teammate' : ''}${
        unread > 0 ? `, ${unread} unread` : ''
      }${!isBot && conversation.isOnline ? ', online' : ''}`}
    >
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
      </span>
      <span className="conversation__body">
        <span className="conversation__top">
          <span className="conversation__name-row">
            <span className="conversation__name">{conversation.displayName}</span>
            {isBot && <BotBadge />}
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
          {unread > 0 && (
            <span className="unread-count" aria-label={`${unread} unread`}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

export function ConversationDrawer({
  focus = 'search',
  onClose,
}: {
  focus?: 'search' | 'close';
  onClose: () => void;
}) {
  const { user } = useAuth();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const currentId = activeConversationId(location.pathname);
  const inbox = useQuery({
    queryKey: queryKeys.inbox,
    queryFn: () => api.getInbox(50),
    staleTime: 15_000,
  });

  const conversations = inbox.data?.conversations ?? [];
  const totalUnread = conversations.reduce(
    (sum, conversation) => sum + conversation.unreadCount,
    0,
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) => {
      return (
        conversation.displayName.toLowerCase().includes(needle) ||
        (conversation.lastMessageContent ?? '').toLowerCase().includes(needle)
      );
    });
  }, [conversations, query]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      if (focus === 'search') {
        searchRef.current?.focus();
      } else {
        closeRef.current?.focus();
      }
    }, 40);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [focus, onClose]);

  const countLabel = inbox.isSuccess
    ? query.trim()
      ? `${filtered.length} of ${conversations.length}`
      : totalUnread > 0
        ? `${totalUnread} unread`
        : `${conversations.length} open`
    : 'desk';

  return (
    <div className="drawer-layer drawer-layer--conversations">
      <button
        type="button"
        className="conversation-scrim"
        aria-label="Close conversations"
        tabIndex={-1}
        onClick={onClose}
      />
      <aside
        className="conversation-drawer"
        id="conversation-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conversation-drawer-title"
        ref={dialogRef}
      >
        <header className="conversation-drawer__masthead">
          <div className="conversation-drawer__brand-row">
            <div className="conversation-drawer__brand">
              <Link
                to="/inbox"
                className="conversation-drawer__wordmark-link"
                onClick={onClose}
                aria-label="Banter inbox"
              >
                <Wordmark />
              </Link>
              <p className="mono" id="conversation-drawer-title">
                signal desk / thread index
              </p>
            </div>
            <button
              type="button"
              className="icon-button conversation-drawer__close"
              onClick={onClose}
              aria-label="Close conversations"
              ref={closeRef}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="conversation-drawer__tools">
          <label className="conversation-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search conversations</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations"
              autoComplete="off"
              aria-label="Search conversations"
            />
            {query && (
              <button
                type="button"
                className="conversation-search__clear"
                onClick={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
                aria-label="Clear conversation search"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
            <kbd className="conversation-search__key mono" aria-hidden="true">
              {query ? 'esc' : commandKeyLabel()}
            </kbd>
          </label>

          <Link to="/new" className="new-thread-button" onClick={onClose}>
            <span className="new-thread-button__icon">
              <MessageSquarePlus size={17} aria-hidden="true" />
            </span>
            <span>New thread</span>
            <span className="new-thread-button__hint mono">find people</span>
          </Link>
        </div>

        <div className="conversation-drawer__heading">
          <h2>Conversations</h2>
          <span className="mono conversation-drawer__count" role="status" aria-live="polite">
            {countLabel}
          </span>
        </div>

        <div className="conversation-drawer__scroll">
          {inbox.isPending && <LoadingRows count={5} />}

          {inbox.isError && (
            <div className="conversation-drawer__error" role="alert">
              <p className="mono">the desk did not load</p>
              <p>{errorMessage(inbox.error)}</p>
              <button type="button" className="text-button" onClick={() => void inbox.refetch()}>
                Try again
              </button>
            </div>
          )}

          {inbox.isSuccess && conversations.length === 0 && (
            <div className="conversation-drawer__empty">
              <p className="mono">no signals yet</p>
              <h3>Start the first thread.</h3>
              <p>Search for a person and open a direct message, or gather a few people into a group.</p>
              <Link to="/new" className="button button--ink button--small" onClick={onClose}>
                Find someone
              </Link>
            </div>
          )}

          {inbox.isSuccess && conversations.length > 0 && filtered.length === 0 && (
            <div className="conversation-drawer__empty">
              <p className="mono">no matches</p>
              <h3>No conversation matches “{query.trim()}”.</h3>
              <p>Try a name or a word from the last message.</p>
              <button type="button" className="text-button" onClick={() => setQuery('')}>
                Clear search
              </button>
            </div>
          )}

          {filtered.length > 0 && (
            <nav className="conversation-list" aria-label="Conversations">
              {filtered.map((conversation) => (
                <ConversationRow
                  key={conversation.conversationId}
                  conversation={conversation}
                  active={conversation.conversationId === currentId}
                  onNavigate={onClose}
                />
              ))}
            </nav>
          )}
        </div>

        <footer className="conversation-drawer__footer">
          {user && (
            <Link to="/me" className="conversation-drawer__account" onClick={onClose} aria-label="Your session">
              <Monogram name={user.displayName} src={user.profilePictureUrl} size="xs" />
              <span className="conversation-drawer__account-text">
                <span className="conversation-drawer__account-name">{user.displayName}</span>
                <span className="mono">your session</span>
              </span>
            </Link>
          )}
          <PrivateWindowNote compact />
        </footer>
      </aside>
    </div>
  );
}
