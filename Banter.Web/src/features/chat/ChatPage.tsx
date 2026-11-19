import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { ApiError } from '../../lib/api';
import { useAuth } from '../auth/AuthProvider';
import { useRail } from '../../layouts/RailContext';
import { useRealtime } from '../../lib/realtime/RealtimeProvider';
import { useInbox } from '../conversation/hooks/useInbox';
import { useConversationDetail } from '../conversation/hooks/useConversationDetail';
import {
  channelDetail,
  channelKind,
  useConversationIdentity,
} from '../conversation/model/identity';
import { TransmissionBand } from '../../components/ui/TransmissionBand';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { Composer } from './components/Composer';
import { DetailsDrawer } from '../details/DetailsDrawer';
import { useChatMessages } from './hooks/useChatMessages';
import { useChatScroll } from './hooks/useChatScroll';
import { useMarkRead } from './hooks/useMarkRead';
import { useMessageAnnouncements } from './hooks/useMessageAnnouncements';
import { useSendMessage } from './hooks/useSendMessage';
import { latestRealMessage as findLatestRealMessage } from './model/timeline';

export function ChatPage() {
  const { conversationId = '' } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { state: realtimeState, retry: retryRealtime, botTyping } = useRealtime();
  const { drawerOpen, openDrawer } = useRail();

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const closeDetails = useCallback(() => setDetailsOpen(false), []);

  const inbox = useInbox(50);
  const detail = useConversationDetail(conversationId);

  const fallback = inbox.data?.conversations.find(
    (conversation) => conversation.conversationId === conversationId,
  );
  const identity = useConversationIdentity(detail.data, fallback, user?.id);
  const typingBot = botTyping[conversationId] ?? null;

  const { query: messagesQuery, messages, lastSeenMessageId } = useChatMessages(conversationId);
  const latestRealMessage = useMemo(
    () => findLatestRealMessage(messages),
    [messages],
  );

  const restoreDraft = useCallback((content: string) => {
    setDraft((current) => current || content);
  }, []);

  const {
    send,
    isPending: isSending,
    error: sendError,
    clearError: clearSendError,
  } = useSendMessage({ conversationId, onRestoreDraft: restoreDraft });

  useMarkRead({ conversationId, latestMessage: latestRealMessage, lastSeenMessageId });

  const { feedRef, showJump, handleScroll, loadOlder, jumpToLatest, pinToBottom, canLoadOlder, isFetchingOlder } =
    useChatScroll({
      conversationId,
      messages,
      hasNextPage: Boolean(messagesQuery.hasNextPage),
      isFetchingNextPage: messagesQuery.isFetchingNextPage,
      fetchNextPage: messagesQuery.fetchNextPage,
    });

  const liveAnnouncement = useMessageAnnouncements({
    messages,
    conversationId,
    currentUserId: user?.id,
  });

  useEffect(() => {
    setDetailsOpen(false);
    setDraft('');
    clearSendError();
  }, [conversationId, clearSendError]);

  const channelIndex = useMemo(() => {
    const index = inbox.data?.conversations.findIndex(
      (conversation) => conversation.conversationId === conversationId,
    );
    return index !== undefined && index >= 0 ? String(index + 1).padStart(2, '0') : null;
  }, [inbox.data, conversationId]);

  const kind = channelKind(identity);
  const detailLine = channelDetail(identity, typingBot);
  const isForbidden =
    messagesQuery.error instanceof ApiError &&
    (messagesQuery.error.status === 403 || messagesQuery.error.status === 404);
  const status = messagesQuery.isPending
    ? 'pending'
    : messagesQuery.isError
      ? 'error'
      : 'success';

  const handleSend = (content: string) => {
    pinToBottom();
    send(content);
  };

  return (
    <section className="chat" aria-labelledby="chat-title">
      <div className="sr-only" role="status" aria-live="polite">
        {liveAnnouncement}
      </div>
      <TransmissionBand
        context={channelIndex ? `channel ${channelIndex}` : 'channel'}
        detail={detailLine}
        attention={Boolean(typingBot)}
      />

      <ChatHeader
        title={identity.title}
        channelIndex={channelIndex}
        channelKind={kind}
        isGroup={identity.isGroup}
        isBotConversation={identity.isBotConversation}
        online={identity.online}
        onlineCount={identity.onlineCount}
        participants={identity.participants}
        drawerOpen={drawerOpen}
        detailsOpen={detailsOpen}
        onOpenDrawer={openDrawer}
        onOpenDetails={() => setDetailsOpen(true)}
      />

      <MessageList
        status={status}
        messages={messages}
        currentUserId={user?.id}
        error={messagesQuery.error}
        forbidden={isForbidden}
        onRetry={() => void messagesQuery.refetch()}
        feedRef={feedRef}
        onScroll={handleScroll}
        canLoadOlder={canLoadOlder}
        isFetchingOlder={isFetchingOlder}
        onLoadOlder={loadOlder}
        realtimeState={realtimeState}
      />

      {showJump && (
        <button type="button" className="jump-latest" onClick={jumpToLatest}>
          <ChevronUp size={15} className="jump-latest__icon" aria-hidden="true" />
          Latest
        </button>
      )}

      <Composer
        title={identity.title}
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        sending={isSending}
        ready={messagesQuery.isSuccess}
        inputDisabled={messagesQuery.isError}
        error={sendError}
        typingBot={typingBot}
        realtimeState={realtimeState}
        onRetryRealtime={retryRealtime}
      />

      <DetailsDrawer
        conversationId={conversationId}
        fallbackName={identity.title || 'Conversation'}
        fallbackIsGroup={identity.isGroup}
        open={detailsOpen}
        onClose={closeDetails}
      />
    </section>
  );
}
