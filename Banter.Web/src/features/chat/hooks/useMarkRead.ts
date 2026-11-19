import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import type { ChatMessage, InboxPage } from '../../../lib/api/contracts';
import { queryKeys } from '../../../lib/queryKeys';
import { markConversationRead } from '../../../lib/realtime/cacheUpdates';

export function useMarkRead({
  conversationId,
  latestMessage,
  lastSeenMessageId,
}: {
  conversationId: string;
  latestMessage: ChatMessage | undefined;
  lastSeenMessageId: string | null;
}) {
  const queryClient = useQueryClient();
  const markedMessageRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.markAsRead(conversationId),
    onSuccess: () => {
      queryClient.setQueryData<InboxPage>(queryKeys.inbox, (current) =>
        markConversationRead(current, conversationId),
      );
    },
    onError: () => {
      markedMessageRef.current = null;
    },
  });

  useEffect(() => {
    markedMessageRef.current = null;
  }, [conversationId]);

  useEffect(() => {
    if (!latestMessage) return;
    if (latestMessage.id === lastSeenMessageId) return;
    if (markedMessageRef.current === latestMessage.id) return;
    markedMessageRef.current = latestMessage.id;
    mutation.mutate();
  }, [latestMessage, lastSeenMessageId, mutation.mutate]);

  return mutation;
}
