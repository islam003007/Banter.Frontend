import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useParams } from 'react-router-dom';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { differenceInMinutes } from 'date-fns';
import {
  ArrowUp,
  ChevronUp,
  Info,
  Loader2,
  PanelLeft,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { api, errorMessage, ApiError } from '../lib/api';
import { resolveIsBot } from '../lib/bots';
import { formatClock, formatDayLabel, formatLongDate, parseDate } from '../lib/format';
import { queryKeys } from '../lib/queryKeys';
import type { ChatMessage, InboxPage, MessagesPage } from '../lib/types';
import { useAuth } from '../auth/AuthProvider';
import { useRealtime } from '../realtime/RealtimeProvider';
import { useRail } from '../layouts/RailContext';
import { BotBadge } from '../components/BotBadge';
import { Monogram, PresenceDot } from '../components/Monogram';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { DetailsDrawer } from '../components/DetailsDrawer';
import { ErrorState } from '../components/PageState';

const MESSAGE_LIMIT = 2000;

function dayKey(value: string): string {
  const date = parseDate(value) ?? new Date();
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function flattenMessages(pages: MessagesPage[] | undefined): ChatMessage[] {
  if (!pages) return [];
  const seen = new Set<string>();
  const all: ChatMessage[] = [];
  for (const page of pages) {
    for (const message of page.messages) {
      if (seen.has(message.id)) continue;
      seen.add(message.id);
      all.push(message);
    }
  }
  return all.sort((left, right) => {
    const leftTime = parseDate(left.createdAt)?.getTime() ?? 0;
    const rightTime = parseDate(right.createdAt)?.getTime() ?? 0;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return left.id.localeCompare(right.id);
  });
}

function updateInboxAfterSend(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  content: string,
  createdAt: string,
) {
  queryClient.setQueryData<InboxPage>(queryKeys.inbox, (current) => {
    if (!current) return current;
    const conversations = current.conversations
      .map((conversation) =>
        conversation.conversationId === conversationId
          ? {
              ...conversation,
              lastMessageContent: content,
              lastMessageCreatedAt: createdAt,
              unreadCount: 0,
            }
          : conversation,
      )
      .sort((left, right) => {
        const leftTime = left.lastMessageCreatedAt
          ? new Date(left.lastMessageCreatedAt).getTime()
          : 0;
        const rightTime = right.lastMessageCreatedAt
          ? new Date(right.lastMessageCreatedAt).getTime()
          : 0;
        return rightTime - leftTime;
      });
    return { ...current, conversations };
  });
}

function ChatSkeleton() {
  return (
    <div className="chat-skeleton" role="status" aria-label="Loading messages">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className={`chat-skeleton__row ${index % 3 === 2 ? 'is-own' : ''}`.trim()} key={index}>
          <span className="chat-skeleton__avatar" />
          <span className="chat-skeleton__body">
            <span className="chat-skeleton__line chat-skeleton__line--short" />
            <span className="chat-skeleton__line" />
            <span className="chat-skeleton__line" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function ChatPage() {
  const { conversationId = '' } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { state: realtimeState, retry: retryRealtime, botTyping } = useRealtime();
  const { drawerOpen, openDrawer } = useRail();
  const queryClient = useQueryClient();

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const closeDetails = useCallback(() => setDetailsOpen(false), []);

  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const atBottomRef = useRef(true);
  const initialLoadedRef = useRef(false);
  const restoreRef = useRef<{ height: number; top: number } | null>(null);
  const previousLastIdRef = useRef<string | null>(null);
  const loadedConversationRef = useRef<string | null>(null);
  const markedMessageRef = useRef<string | null>(null);
  const announcedMessageRef = useRef<string | null>(null);
  const announcedConversationRef = useRef<string | null>(null);

  const inbox = useQuery({
    queryKey: queryKeys.inbox,
    queryFn: () => api.getInbox(50),
    staleTime: 15_000,
  });

  const detail = useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: () => api.getConversation(conversationId),
    staleTime: 30_000,
    retry: 1,
    enabled: Boolean(conversationId),
  });

  const messagesQuery = useInfiniteQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: ({ pageParam }) => api.getMessages(conversationId, pageParam, 30),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    enabled: Boolean(conversationId),
    staleTime: 5_000,
  });

  const fallback = inbox.data?.conversations.find(
    (conversation) => conversation.conversationId === conversationId,
  );
  const isGroup = detail.data?.isGroup ?? fallback?.isGroup ?? false;
  const otherParticipant = detail.data?.participants.find(
    (participant) => participant.userId !== user?.id,
  );
  const title = isGroup
    ? detail.data?.title || fallback?.displayName || 'Group thread'
    : otherParticipant?.displayName ||
      fallback?.displayName ||
      detail.data?.displayName ||
      'Conversation';
  const online = otherParticipant?.isOnline ?? fallback?.isOnline ?? false;
  const participants = detail.data?.participants ?? [];
  const onlineCount = participants.filter(
    (participant) =>
      !resolveIsBot(participant.isBot, participant.displayName) && participant.isOnline,
  ).length;
  const otherIsBot = otherParticipant
    ? resolveIsBot(otherParticipant.isBot, otherParticipant.displayName)
    : resolveIsBot(detail.data?.isBot ?? fallback?.isBot, title);
  const isBotConversation = !isGroup && otherIsBot;
  const typingBot = botTyping[conversationId] ?? null;

  const messages = useMemo(
    () => flattenMessages(messagesQuery.data?.pages),
    [messagesQuery.data],
  );
  const latestRealMessage = useMemo(
    () => [...messages].reverse().find((message) => !message.id.startsWith('pending-')),
    [messages],
  );
  const lastSeenMessageId = messagesQuery.data?.pages[0]?.lastSeenMessageId ?? null;

  useEffect(() => {
    if (announcedConversationRef.current !== conversationId) {
      announcedConversationRef.current = conversationId;
      announcedMessageRef.current = null;
      setLiveAnnouncement('');
    }

    const latest = messages[messages.length - 1];
    if (!latest) return;
    if (!announcedMessageRef.current) {
      announcedMessageRef.current = latest.id;
      return;
    }
    if (
      latest.id !== announcedMessageRef.current &&
      latest.userId !== user?.id &&
      !latest.id.startsWith('pending-')
    ) {
      const preview = latest.content.length > 120 ? `${latest.content.slice(0, 120)}…` : latest.content;
      setLiveAnnouncement(`New message from ${latest.displayName}: ${preview}`);
    }
    announcedMessageRef.current = latest.id;
  }, [messages, conversationId, user?.id]);

  useEffect(() => {
    setDetailsOpen(false);
    setDraft('');
    setSendError(null);
    setShowJump(false);
    atBottomRef.current = true;
    initialLoadedRef.current = false;
    previousLastIdRef.current = null;
    markedMessageRef.current = null;
  }, [conversationId]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 168)}px`;
  }, [draft]);

  const { mutate: markReadMutate } = useMutation({
    mutationFn: () => api.markAsRead(conversationId),
    onSuccess: () => {
      queryClient.setQueryData<InboxPage>(queryKeys.inbox, (current) => {
        if (!current) return current;
        return {
          ...current,
          conversations: current.conversations.map((conversation) =>
            conversation.conversationId === conversationId
              ? { ...conversation, unreadCount: 0 }
              : conversation,
          ),
        };
      });
    },
    onError: () => {
      markedMessageRef.current = null;
    },
  });

  useEffect(() => {
    if (!latestRealMessage) return;
    if (latestRealMessage.id === lastSeenMessageId) return;
    if (markedMessageRef.current === latestRealMessage.id) return;
    markedMessageRef.current = latestRealMessage.id;
    markReadMutate();
  }, [latestRealMessage, lastSeenMessageId, markReadMutate]);

  const sendMessage = useMutation({
    mutationFn: (content: string) => api.sendMessage(conversationId, content),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(conversationId) });

      const tempId = `pending-${crypto.randomUUID()}`;
      const createdAt = new Date().toISOString();
      const optimistic: ChatMessage = {
        id: tempId,
        content,
        createdAt,
        userId: user?.id ?? '',
        displayName: user?.displayName ?? 'You',
        profilePictureUrl: user?.profilePictureUrl ?? null,
        isBot: false,
      };

      queryClient.setQueryData<InfiniteData<MessagesPage, string | null>>(
        queryKeys.messages(conversationId),
        (current) => {
          if (!current || current.pages.length === 0) return current;
          const [first, ...rest] = current.pages;
          return {
            ...current,
            pages: [
              { ...first, messages: [optimistic, ...first.messages] },
              ...rest,
            ],
          };
        },
      );

      const inboxSnapshot = queryClient.getQueryData<InboxPage>(queryKeys.inbox);
      updateInboxAfterSend(queryClient, conversationId, content, createdAt);

      return { tempId, inboxSnapshot };
    },
    onSuccess: (messageId, _content, context) => {
      if (!context) return;
      if (!messageId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
        return;
      }
      queryClient.setQueryData<InfiniteData<MessagesPage, string | null>>(
        queryKeys.messages(conversationId),
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              messages: page.messages.map((message) =>
                message.id === context.tempId ? { ...message, id: messageId } : message,
              ),
            })),
          };
        },
      );
    },
    onError: (error, content, context) => {
      setSendError(errorMessage(error));
      setDraft((current) => current || content);
      if (context) {
        queryClient.setQueryData<InfiniteData<MessagesPage, string | null>>(
          queryKeys.messages(conversationId),
          (current) => {
            if (!current) return current;
            return {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                messages: page.messages.filter((message) => message.id !== context.tempId),
              })),
            };
          },
        );
        if (context.inboxSnapshot) {
          queryClient.setQueryData(queryKeys.inbox, context.inboxSnapshot);
        }
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
    },
  });

  const handleLoadOlder = () => {
    const feed = feedRef.current;
    if (feed) {
      restoreRef.current = { height: feed.scrollHeight, top: feed.scrollTop };
    }
    void messagesQuery.fetchNextPage();
  };

  useLayoutEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    if (loadedConversationRef.current !== conversationId) {
      loadedConversationRef.current = conversationId;
      initialLoadedRef.current = false;
      previousLastIdRef.current = null;
      atBottomRef.current = true;
      restoreRef.current = null;
    }

    if (messages.length === 0) return;

    if (!initialLoadedRef.current) {
      feed.scrollTop = feed.scrollHeight;
      initialLoadedRef.current = true;
      previousLastIdRef.current = messages[messages.length - 1].id;
      return;
    }

    if (restoreRef.current) {
      const snapshot = restoreRef.current;
      restoreRef.current = null;
      feed.scrollTop = feed.scrollHeight - snapshot.height + snapshot.top;
      previousLastIdRef.current = messages[messages.length - 1].id;
      return;
    }

    const lastId = messages[messages.length - 1].id;
    if (lastId !== previousLastIdRef.current) {
      previousLastIdRef.current = lastId;
      if (atBottomRef.current) {
        feed.scrollTop = feed.scrollHeight;
        setShowJump(false);
      } else {
        setShowJump(true);
      }
    }
  }, [messages, conversationId]);

  const handleScroll = () => {
    const feed = feedRef.current;
    if (!feed) return;
    const distance = feed.scrollHeight - feed.scrollTop - feed.clientHeight;
    atBottomRef.current = distance < 90;
    if (distance < 90) setShowJump(false);
  };

  const jumpToLatest = () => {
    const feed = feedRef.current;
    if (!feed) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    feed.scrollTo({ top: feed.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
    atBottomRef.current = true;
    setShowJump(false);
  };

  const send = () => {
    const content = draft.trim();
    if (!content || sendMessage.isPending) return;
    setDraft('');
    setSendError(null);
    atBottomRef.current = true;
    sendMessage.mutate(content);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send();
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  const isForbidden =
    messagesQuery.error instanceof ApiError &&
    (messagesQuery.error.status === 403 || messagesQuery.error.status === 404);

  const grouped = useMemo(() => {
    const nodes: Array<
      | { type: 'day'; key: string; label: string }
      | { type: 'message'; key: string; message: ChatMessage; continuation: boolean }
    > = [];
    let lastDay = '';
    let previous: ChatMessage | null = null;

    for (const message of messages) {
      const key = dayKey(message.createdAt);
      if (key !== lastDay) {
        nodes.push({ type: 'day', key: `day-${key}`, label: formatDayLabel(message.createdAt) });
        lastDay = key;
        previous = null;
      }
      const previousDate = previous ? parseDate(previous.createdAt) : null;
      const currentDate = parseDate(message.createdAt);
      const continuation =
        Boolean(previous) &&
        previous?.userId === message.userId &&
        Boolean(previousDate && currentDate) &&
        Math.abs(differenceInMinutes(currentDate as Date, previousDate as Date)) < 5;

      nodes.push({ type: 'message', key: message.id, message, continuation });
      previous = message;
    }

    return nodes;
  }, [messages]);

  const lastPage = messagesQuery.data?.pages[messagesQuery.data.pages.length - 1];
  const canLoadOlder = Boolean(messagesQuery.hasNextPage);

  return (
    <section className="chat" aria-labelledby="chat-title">
      <div className="sr-only" role="status" aria-live="polite">
        {liveAnnouncement}
      </div>
      <header className="chat__header">
        <div className="chat__topline">
          <div className="chat__topline-left">
            <button
              type="button"
              className="icon-button chat__rail-toggle"
              onClick={openDrawer}
              aria-label="Open conversations"
              aria-expanded={drawerOpen}
              aria-controls="conversation-rail"
            >
              <PanelLeft size={20} aria-hidden="true" />
            </button>
            <span className="mono chat__eyebrow">live thread</span>
            <ConnectionStatus compact />
          </div>
          <button
            type="button"
            className="details-button"
            onClick={() => setDetailsOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={detailsOpen}
          >
            <span>Details</span>
            <Info size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="chat__title-row">
          <Monogram name={title} group={isGroup} size="lg" className="chat__title-monogram" />
          <div className="chat__title-copy">
            <h1 id="chat-title">{title || 'Conversation'}</h1>
            <p className="chat__subtitle mono">
              {isGroup ? (
                <>
                  <span>group thread</span>
                  {participants.length > 0 && (
                    <>
                      <span className="chat__dot" aria-hidden="true" />
                      <span>{participants.length} people</span>
                    </>
                  )}
                  {onlineCount > 0 && (
                    <>
                      <span className="chat__dot" aria-hidden="true" />
                      <span>{onlineCount} online</span>
                    </>
                  )}
                </>
              ) : isBotConversation ? (
                <>
                  <BotBadge />
                  <span>AI teammate</span>
                  <span className="chat__dot" aria-hidden="true" />
                  <span>direct thread</span>
                </>
              ) : (
                <>
                  <PresenceDot online={online} label={online ? 'Online' : 'Offline'} />
                  <span>{online ? 'online' : 'offline'}</span>
                  <span className="chat__dot" aria-hidden="true" />
                  <span>direct thread</span>
                </>
              )}
            </p>
          </div>
        </div>
      </header>

      <div className="chat__feed" ref={feedRef} onScroll={handleScroll}>
        {messagesQuery.isPending && <ChatSkeleton />}

        {messagesQuery.isError && (
          <div className="chat__state">
            <ErrorState
              title={isForbidden ? 'You cannot open this thread.' : 'The history did not load.'}
              message={
                isForbidden
                  ? 'This conversation may have been left, or your session does not have access to it.'
                  : errorMessage(messagesQuery.error)
              }
              onRetry={isForbidden ? undefined : () => void messagesQuery.refetch()}
              backTo="/inbox"
              backLabel="Back to inbox"
            />
          </div>
        )}

        {messagesQuery.isSuccess && messages.length === 0 && (
          <div className="chat__state chat__state--empty">
            <p className="mono">quiet wire</p>
            <h2>A thread with nothing on it yet.</h2>
            <p>Send the first line. It lands in the history and crosses to the other side live.</p>
          </div>
        )}

        {messages.length > 0 && (
          <div className="feed">
            <div className="feed__start">
              {canLoadOlder ? (
                <button
                  type="button"
                  className="load-older"
                  onClick={handleLoadOlder}
                  disabled={messagesQuery.isFetchingNextPage}
                >
                  {messagesQuery.isFetchingNextPage ? (
                    <Loader2 className="spin" size={15} aria-hidden="true" />
                  ) : (
                    <ChevronUp size={15} aria-hidden="true" />
                  )}
                  {messagesQuery.isFetchingNextPage ? 'Loading older messages' : 'Load older messages'}
                </button>
              ) : (
                <span className="mono">{lastPage ? 'start of this thread' : ''}</span>
              )}
            </div>

            {grouped.map((node) =>
              node.type === 'day' ? (
                <div className="day-divider" key={node.key}>
                  <span className="mono">{node.label}</span>
                </div>
              ) : (
                <MessageRow
                  key={node.key}
                  message={node.message}
                  continuation={node.continuation}
                  mine={node.message.userId === user?.id}
                />
              ),
            )}
          </div>
        )}
      </div>

      {showJump && (
        <button type="button" className="jump-latest" onClick={jumpToLatest}>
          <ChevronUp size={15} className="jump-latest__icon" aria-hidden="true" />
          Latest
        </button>
      )}

      <div className="chat__composer-wrap">
        {typingBot && (
          <div className="bot-thinking" role="status">
            <span className="bot-thinking__signal" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>
              <strong>{typingBot}</strong> is thinking…
            </span>
          </div>
        )}

        {realtimeState === 'disconnected' && (
          <div className="realtime-banner" role="status">
            <WifiOff size={15} aria-hidden="true" />
            <span>Live updates are paused. You can still send; reconnect to catch up.</span>
            <button type="button" className="text-button" onClick={retryRealtime}>
              <RefreshCw size={13} aria-hidden="true" />
              Reconnect
            </button>
          </div>
        )}

        {sendError && (
          <p className="composer__error" role="alert">
            {sendError}
          </p>
        )}

        <form className="composer" onSubmit={handleSubmit}>
          <div className="composer__field">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              rows={1}
              maxLength={MESSAGE_LIMIT}
              placeholder={`Write to ${title || 'the thread'}`}
              aria-label={`Message ${title || 'the thread'}`}
              aria-describedby="composer-hint"
              disabled={messagesQuery.isError}
            />
            <div className="composer__foot">
              <span className="composer__hint mono" id="composer-hint">
                enter sends · shift + enter breaks the line
              </span>
              <span className={`composer__count mono ${draft.length > MESSAGE_LIMIT - 200 ? 'is-near' : ''}`.trim()}>
                {draft.length > MESSAGE_LIMIT - 200 ? `${draft.length}/${MESSAGE_LIMIT}` : ''}
              </span>
              <button
                type="submit"
                className="send-button"
                disabled={!draft.trim() || !messagesQuery.isSuccess}
                aria-label="Send message"
              >
                <span>Send</span>
                <ArrowUp size={17} aria-hidden="true" />
              </button>
            </div>
          </div>
        </form>
        <div className="composer__note">
          <span className="mono">
            {realtimeState === 'connected'
              ? 'messages arrive live'
              : realtimeState === 'connecting' || realtimeState === 'reconnecting'
                ? 'restoring the live connection'
                : 'live updates paused — send still works'}
          </span>
        </div>
      </div>

      <DetailsDrawer
        conversationId={conversationId}
        fallbackName={title || 'Conversation'}
        fallbackIsGroup={isGroup}
        open={detailsOpen}
        onClose={closeDetails}
      />
    </section>
  );
}

function MessageRow({
  message,
  continuation,
  mine,
}: {
  message: ChatMessage;
  continuation: boolean;
  mine: boolean;
}) {
  const pending = message.id.startsWith('pending-');
  const time = formatClock(message.createdAt);
  const isBot = resolveIsBot(message.isBot, message.displayName);

  if (mine) {
    return (
      <article className={`message message--mine ${continuation ? 'is-continuation' : ''}`.trim()}>
        <div className="message__own-meta mono">
          {pending && <span className="message__sending">sending</span>}
          <time dateTime={message.createdAt} title={formatLongDate(message.createdAt)}>
            {time}
          </time>
        </div>
        <p className={`message__own-body ${pending ? 'is-pending' : ''}`.trim()}>{message.content}</p>
      </article>
    );
  }

  return (
    <article
      className={`message message--theirs ${continuation ? 'is-continuation' : ''}`.trim()}
      aria-label={`${message.displayName}${isBot ? ', AI teammate' : ''} at ${time}`}
    >
      <div className="message__avatar">
        {!continuation && (
          <Monogram name={message.displayName} src={message.profilePictureUrl} size="sm" />
        )}
      </div>
      <div className="message__body">
        {!continuation && (
          <header className="message__meta">
            <span className="message__name">{message.displayName}</span>
            {isBot && <BotBadge />}
            <time dateTime={message.createdAt} title={formatLongDate(message.createdAt)}>
              {time}
            </time>
          </header>
        )}
        <p className="message__text">{message.content}</p>
      </div>
    </article>
  );
}
