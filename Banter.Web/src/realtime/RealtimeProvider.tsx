import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { queryKeys } from '../lib/queryKeys';
import { useAuth } from '../auth/AuthProvider';
import type {
  ChatMessage,
  InboxPage,
  MessageNotification,
  MessagesPage,
  RealtimeState,
} from '../lib/types';

interface RealtimeContextValue {
  state: RealtimeState;
  retry: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

function conversationIdFromPath(pathname: string): string | null {
  const match = /^\/c\/([^/]+)/.exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function toChatMessage(notification: MessageNotification): ChatMessage {
  return {
    id: notification.id,
    content: notification.content,
    createdAt: notification.createdAt,
    userId: notification.userId,
    displayName: notification.displayName,
    profilePictureUrl: notification.profilePictureUrl,
  };
}

function normalizeNotification(value: unknown): MessageNotification | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const id = typeof source.id === 'string' ? source.id : null;
  const conversationId = typeof source.conversationId === 'string' ? source.conversationId : null;
  if (!id || !conversationId) return null;

  const sender =
    source.senderDisplayName ?? source.senderName ?? source.displayName ?? source.userName;
  const profile =
    source.senderProfilePictureUrl ?? source.profilePictureUrl ?? source.senderProfilePicture;

  return {
    id,
    conversationId,
    content: typeof source.content === 'string' ? source.content : '',
    userId: typeof source.userId === 'string' ? source.userId : '',
    displayName: typeof sender === 'string' ? sender : 'New message',
    profilePictureUrl: typeof profile === 'string' ? profile : null,
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : new Date().toISOString(),
  };
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const activeConversationRef = useRef<string | null>(conversationIdFromPath(location.pathname));
  const [state, setState] = useState<RealtimeState>('connecting');
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    activeConversationRef.current = conversationIdFromPath(location.pathname);
  }, [location.pathname]);

  const retry = useCallback(() => {
    setRetryNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!user) return;

    let disposed = false;
    let heartbeat: number | undefined;
    let retryTimer: number | undefined;

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/chat', { withCredentials: true })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (context) => {
          if (context.previousRetryCount >= 6) return null;
          return [0, 1000, 3000, 6000, 12000, 20000][context.previousRetryCount] ?? 20000;
        },
      })
      .configureLogging(LogLevel.Warning)
      .build();

    const onMessage = (payload: unknown) => {
      const notification = normalizeNotification(payload);
      if (!notification) return;

      const isActive = activeConversationRef.current === notification.conversationId;

      const messagesKey = queryKeys.messages(notification.conversationId);
      queryClient.setQueryData<InfiniteData<MessagesPage, string | null>>(messagesKey, (current) => {
        if (!current || current.pages.length === 0) return current;
        if (current.pages.some((page) => page.messages.some((message) => message.id === notification.id))) {
          return current;
        }
        const [first, ...rest] = current.pages;
        return {
          ...current,
          pages: [
            { ...first, messages: [toChatMessage(notification), ...first.messages] },
            ...rest,
          ],
        };
      });

      const inbox = queryClient.getQueryData<InboxPage>(queryKeys.inbox);
      const exists =
        inbox?.conversations.some(
          (conversation) => conversation.conversationId === notification.conversationId,
        ) ?? false;

      if (!exists) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
      } else {
        queryClient.setQueryData<InboxPage>(queryKeys.inbox, (current) => {
          if (!current) return current;
          const conversations = current.conversations
            .map((conversation) => {
              if (conversation.conversationId !== notification.conversationId) return conversation;
              const isOwnMessage = notification.userId === user.id;
              return {
                ...conversation,
                lastMessageContent: notification.content,
                lastMessageCreatedAt: notification.createdAt,
                unreadCount:
                  isActive || isOwnMessage ? 0 : conversation.unreadCount + 1,
              };
            })
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

      if (isActive) {
        queryClient.setQueryData<InboxPage>(queryKeys.inbox, (current) => {
          if (!current) return current;
          return {
            ...current,
            conversations: current.conversations.map((conversation) =>
              conversation.conversationId === notification.conversationId
                ? { ...conversation, unreadCount: 0 }
                : conversation,
            ),
          };
        });
      }
    };

    const beginHeartbeat = () => {
      if (heartbeat) window.clearInterval(heartbeat);
      heartbeat = window.setInterval(() => {
        if (connection.state === HubConnectionState.Connected) {
          void connection.invoke('Heartbeat').catch(() => {
            // The automatic reconnect loop owns recovery.
          });
        }
      }, 25_000);
    };

    connection.on('ReceiveMessage', onMessage);

    connection.onreconnecting(() => {
      if (!disposed) setState('reconnecting');
    });

    connection.onreconnected(() => {
      if (disposed) return;
      setState('connected');
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
      const activeId = activeConversationRef.current;
      if (activeId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.messages(activeId) });
      }
    });

    connection.onclose(() => {
      if (!disposed) setState('disconnected');
    });

    const start = async (attempt = 0) => {
      if (disposed) return;
      if (attempt === 0) setState('connecting');
      try {
        await connection.start();
        if (disposed) {
          await connection.stop();
          return;
        }
        setState('connected');
        beginHeartbeat();
      } catch {
        if (disposed) return;
        setState('disconnected');
        if (attempt < 2) {
          retryTimer = window.setTimeout(() => void start(attempt + 1), 2500 * (attempt + 1));
        }
      }
    };

    void start();

    return () => {
      disposed = true;
      connection.off('ReceiveMessage', onMessage);
      if (heartbeat) window.clearInterval(heartbeat);
      if (retryTimer) window.clearTimeout(retryTimer);
      void connection.stop();
    };
  }, [user, queryClient, retryNonce]);

  const value = useMemo<RealtimeContextValue>(() => ({ state, retry }), [state, retry]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used inside RealtimeProvider');
  return context;
}
