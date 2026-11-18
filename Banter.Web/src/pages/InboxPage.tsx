import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, MessageSquarePlus, Radio } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { api, errorMessage } from '../lib/api';
import { BOT_ROSTER, resolveIsBot } from '../lib/bots';
import { firstName, formatThreadTime } from '../lib/format';
import { queryKeys } from '../lib/queryKeys';
import type { InboxConversation } from '../lib/types';
import { BotBadge } from '../components/BotBadge';
import { Monogram, PresenceDot } from '../components/Monogram';
import { PrivateWindowNote } from '../components/PrivateWindowNote';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function threadTimestamp(conversation: InboxConversation): number {
  if (!conversation.lastMessageCreatedAt) return 0;
  const time = new Date(conversation.lastMessageCreatedAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function unreadLabel(count: number): string {
  return count > 99 ? '99+' : String(count);
}

function padCount(count: number): string {
  return count > 0 ? String(count).padStart(2, '0') : '00';
}

function ThreadCard({ conversation }: { conversation: InboxConversation }) {
  const isBot = !conversation.isGroup && resolveIsBot(conversation.isBot, conversation.displayName);
  const online = !conversation.isGroup && !isBot && conversation.isOnline;
  const hasMessage = Boolean(conversation.lastMessageContent);
  const time = formatThreadTime(conversation.lastMessageCreatedAt);
  const kind = conversation.isGroup
    ? 'group thread'
    : isBot
      ? 'AI teammate'
      : online
        ? 'online now'
        : 'direct thread';

  return (
    <Link
      to={`/c/${conversation.conversationId}`}
      className="welcome-thread"
      aria-label={`${conversation.displayName}${
        conversation.unreadCount > 0 ? `, ${conversation.unreadCount} unread` : ''
      }${online ? ', online' : ''} — open thread`}
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
              label={`${conversation.displayName} is ${conversation.isOnline ? 'online' : 'offline'}`}
            />
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
          : 'No messages yet — open the thread to start it.'}
      </span>
      <span className="welcome-thread__foot mono">
        <span>{hasMessage ? 'latest message' : 'quiet thread'}</span>
        <span className="welcome-thread__open">
          open
          <ArrowRight size={12} aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

function ThreadSkeleton() {
  return (
    <div className="welcome-thread welcome-thread--skeleton" aria-hidden="true">
      <span className="welcome-thread__skeleton-line welcome-thread__skeleton-line--name" />
      <span className="welcome-thread__skeleton-line welcome-thread__skeleton-line--meta" />
      <span className="welcome-thread__skeleton-line" />
      <span className="welcome-thread__skeleton-line welcome-thread__skeleton-line--short" />
    </div>
  );
}

export function InboxPage() {
  const { user } = useAuth();
  const inbox = useQuery({
    queryKey: queryKeys.inbox,
    queryFn: () => api.getInbox(50),
    staleTime: 15_000,
  });

  const conversations = inbox.data?.conversations ?? [];
  const activeThreads = [...conversations].sort(
    (left, right) =>
      threadTimestamp(right) - threadTimestamp(left) || right.unreadCount - left.unreadCount,
  );
  const unreadTotal = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  const liveNow = conversations.filter(
    (conversation) =>
      !conversation.isGroup &&
      !resolveIsBot(conversation.isBot, conversation.displayName) &&
      conversation.isOnline,
  ).length;
  const latest = activeThreads[0];
  const latestSignal = latest ? formatThreadTime(latest.lastMessageCreatedAt) : '';
  const pickupThreads = activeThreads.slice(0, 3);
  const botThreads = new Map(
    conversations
      .filter(
        (conversation) =>
          !conversation.isGroup && resolveIsBot(conversation.isBot, conversation.displayName),
      )
      .map((conversation) => [conversation.displayName.trim().toLowerCase(), conversation]),
  );

  return (
    <section className="welcome" aria-labelledby="welcome-heading">
      <div className="welcome__top">
        <p className="welcome__kicker mono">
          signal desk <span aria-hidden="true">/</span> live workspace
        </p>
        <p className="welcome__date mono">
          {new Intl.DateTimeFormat('en', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }).format(new Date())}
        </p>
      </div>

      <div className="welcome__hero">
        <div className="welcome__stage">
          <p className="welcome__hello mono">{greeting()},</p>
          <h1 id="welcome-heading" className="welcome__title">
            {firstName(user?.displayName)}.
          </h1>
          <p className="welcome__lede">
            The desk is open. Pick a conversation from the rail, or find someone and start a new
            wire.
          </p>

          <div className="welcome__actions">
            {latest ? (
              <Link to={`/c/${latest.conversationId}`} className="button button--ink">
                Open {latest.displayName}
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : (
              <Link to="/new" className="button button--ink">
                Start the first thread
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            )}
            <Link to="/new" className="button button--ghost">
              <MessageSquarePlus size={16} aria-hidden="true" />
              New thread
            </Link>
          </div>

          <dl className="welcome__ledger">
            <div>
              <dt className="mono">unread</dt>
              <dd>{inbox.isPending ? '—' : unreadTotal > 0 ? padCount(unreadTotal) : '00'}</dd>
            </div>
            <div>
              <dt className="mono">threads</dt>
              <dd>{inbox.isPending ? '—' : padCount(conversations.length)}</dd>
            </div>
            <div>
              <dt className="mono">live now</dt>
              <dd>{inbox.isPending ? '—' : liveNow > 0 ? padCount(liveNow) : '—'}</dd>
            </div>
          </dl>
        </div>

        <aside className="welcome__aside" aria-labelledby="welcome-ai-title">
          <div className="welcome__aside-head">
            <p className="mono">the AI desk</p>
            <BotBadge />
          </div>
          <h2 id="welcome-ai-title">Ask Ada, Milo or Nova.</h2>
          <p className="welcome__aside-copy">
            Three AI teammates, each with a different way of thinking. They work in direct
            threads.
          </p>

          <ul className="bot-roster" aria-label="AI teammates">
            {BOT_ROSTER.map((bot) => {
              const botThread = botThreads.get(bot.name.toLowerCase());
              const href = botThread
                ? `/c/${botThread.conversationId}`
                : `/new?with=${encodeURIComponent(bot.name)}`;
              const action = botThread
                ? `Open your thread with ${bot.name}${
                    botThread.unreadCount > 0 ? `, ${botThread.unreadCount} unread` : ''
                  }`
                : `Find ${bot.name} to start a direct thread`;
              return (
                <li key={bot.name}>
                  <Link to={href} className="bot-roster__item" aria-label={action} title={action}>
                    <Monogram name={bot.name} size="xs" />
                    <span className="bot-roster__text">
                      <span className="bot-roster__name">
                        {bot.name}
                        {botThread && botThread.unreadCount > 0 && (
                          <span
                            className="unread-count"
                            aria-label={`${botThread.unreadCount} unread`}
                          >
                            {unreadLabel(botThread.unreadCount)}
                          </span>
                        )}
                      </span>
                      <span className="bot-roster__persona">{bot.persona}</span>
                    </span>
                    <ArrowUpRight size={14} className="bot-roster__arrow" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="welcome__aside-foot mono">AI teammates · direct threads only</p>
          <PrivateWindowNote compact />
        </aside>
      </div>

      <section className="welcome__activity" aria-labelledby="welcome-activity-title">
        <div className="welcome__section-head">
          <div>
            <p className="mono">live desk</p>
            <h2 id="welcome-activity-title">Pick up where you left off.</h2>
          </div>
          <p className="mono welcome__section-meta">
            {inbox.isPending
              ? 'reading the desk'
              : latestSignal
                ? `last signal ${latestSignal}`
                : 'no signals yet'}
          </p>
        </div>

        {inbox.isPending && (
          <div
            className="welcome__threads"
            role="status"
            aria-label="Loading recent conversations"
          >
            <ThreadSkeleton />
            <ThreadSkeleton />
            <ThreadSkeleton />
          </div>
        )}

        {inbox.isError && (
          <div className="welcome__error" role="alert">
            <div>
              <p className="mono">the desk did not load</p>
              <p>{errorMessage(inbox.error)}</p>
            </div>
            <button type="button" className="text-button" onClick={() => void inbox.refetch()}>
              Try again
            </button>
          </div>
        )}

        {inbox.isSuccess && pickupThreads.length === 0 && (
          <div className="welcome__empty">
            <span className="welcome__empty-icon">
              <Radio size={18} aria-hidden="true" />
            </span>
            <div>
              <h3>No signals on the desk yet.</h3>
              <p>Start a thread with someone, or open the AI desk and ask a first question.</p>
            </div>
            <Link to="/new" className="button button--ink button--small">
              Find someone
            </Link>
          </div>
        )}

        {pickupThreads.length > 0 && (
          <div className="welcome__threads">
            {pickupThreads.map((conversation) => (
              <ThreadCard key={conversation.conversationId} conversation={conversation} />
            ))}
          </div>
        )}
      </section>

      <footer className="welcome__footer mono">
        <span>banter / demo workspace</span>
        <span>new messages arrive live</span>
      </footer>
    </section>
  );
}
