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
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { HubConnectionState } from '@microsoft/signalr';
import { queryKeys } from '../queryKeys';
import type { InboxPage, MessageNotification, RealtimeState } from '../api/contracts';
import { useAuth } from '../../features/auth/AuthProvider';
import {
  applyIncomingMessage,
  hasConversation,
  prependMessage,
  type MessagePages,
} from './cacheUpdates';
import { createChatHubConnection, HEARTBEAT_INTERVAL_MS, HEARTBEAT_METHOD } from './hub';
import {
  conversationIdFromPath,
  normalizeBotTyping,
  normalizeNotification,
  toChatMessage,
} from './normalize';
import {
  applyBotTypingSignal,
  createBotTypingController,
  type BotTypingController,
} from './typing';

interface RealtimeContextValue {
  state: RealtimeState;
  retry: () => void;
  botTyping: Record<string, string>;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const activeConversationRef = useRef<string | null>(conversationIdFromPath(location.pathname));
  const [state, setState] = useState<RealtimeState>('connecting');
  const [botTyping, setBotTyping] = useState<Record<string, string>>({});
  const [retryNonce, setRetryNonce] = useState(0);
  const [typingController] = useState<BotTypingController>(() =>
    createBotTypingController(setBotTyping),
  );

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

    const connection = createChatHubConnection();

    const onMessage = (payload: unknown) => {
      const notification = normalizeNotification(payload);
      if (!notification) return;

      typingController.clear(notification.conversationId);
      const isActive = activeConversationRef.current === notification.conversationId;

      queryClient.setQueryData<MessagePages>(
        queryKeys.messages(notification.conversationId),
        (current) => prependMessage(current, toChatMessage(notification)),
      );

      const inbox = queryClient.getQueryData<InboxPage>(queryKeys.inbox);
      if (!hasConversation(inbox, notification.conversationId)) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
        return;
      }

      queryClient.setQueryData<InboxPage>(queryKeys.inbox, (current) =>
        applyIncomingMessage(current, notification as MessageNotification, {
          isActive,
          currentUserId: user.id,
        }),
      );
    };

    const onBotTyping = (payload: unknown, botName?: unknown) => {
      const signal = normalizeBotTyping(payload, botName);
      if (!signal) return;
      applyBotTypingSignal(typingController, signal);
    };

    const beginHeartbeat = () => {
      if (heartbeat) window.clearInterval(heartbeat);
      heartbeat = window.setInterval(() => {
        if (connection.state === HubConnectionState.Connected) {
          void connection.invoke(HEARTBEAT_METHOD).catch(() => {
            // The automatic reconnect loop owns recovery.
          });
        }
      }, HEARTBEAT_INTERVAL_MS);
    };

    connection.on('ReceiveMessage', onMessage);
    connection.on('ReceiveBotTyping', onBotTyping);

    connection.onreconnecting(() => {
      if (disposed) return;
      typingController.clearAll();
      setState('reconnecting');
    });

    connection.onreconnected(() => {
      if (disposed) return;
      typingController.clearAll();
      setState('connected');
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
      const activeId = activeConversationRef.current;
      if (activeId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.messages(activeId) });
      }
    });

    connection.onclose(() => {
      if (disposed) return;
      typingController.clearAll();
      setState('disconnected');
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
      connection.off('ReceiveBotTyping', onBotTyping);
      typingController.clearAll();
      if (heartbeat) window.clearInterval(heartbeat);
      if (retryTimer) window.clearTimeout(retryTimer);
      void connection.stop();
    };
  }, [user, queryClient, retryNonce, typingController]);

  useEffect(() => () => typingController.dispose(), [typingController]);

  const value = useMemo<RealtimeContextValue>(
    () => ({ state, retry, botTyping }),
    [state, retry, botTyping],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error('useRealtime must be used inside RealtimeProvider');
  return context;
}
