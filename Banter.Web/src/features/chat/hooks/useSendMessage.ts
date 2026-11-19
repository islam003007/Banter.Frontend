import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../../../lib/api';
import type { InboxPage } from '../../../lib/api/contracts';
import { queryKeys } from '../../../lib/queryKeys';
import { useAuth } from '../../auth/AuthProvider';
import {
  removeMessage,
  replaceMessageId,
  updateInboxAfterSend,
  type MessagePages,
} from '../../../lib/realtime/cacheUpdates';
import { createOptimisticMessage } from '../model/optimistic';

interface SendContext {
  tempId: string;
  inboxSnapshot: InboxPage | undefined;
}

export function useSendMessage({
  conversationId,
  onRestoreDraft,
}: {
  conversationId: string;
  onRestoreDraft: (content: string) => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (content: string) => api.sendMessage(conversationId, content),
    onMutate: async (content): Promise<SendContext> => {
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(conversationId) });

      const tempId = `pending-${crypto.randomUUID()}`;
      const createdAt = new Date().toISOString();
      const optimistic = createOptimisticMessage({ content, user, id: tempId, createdAt });

      queryClient.setQueryData<MessagePages>(
        queryKeys.messages(conversationId),
        (current) => {
          if (!current || current.pages.length === 0) return current;
          const [first, ...rest] = current.pages;
          return {
            ...current,
            pages: [{ ...first, messages: [optimistic, ...first.messages] }, ...rest],
          };
        },
      );

      const inboxSnapshot = queryClient.getQueryData<InboxPage>(queryKeys.inbox);
      queryClient.setQueryData<InboxPage>(queryKeys.inbox, (current) =>
        updateInboxAfterSend(current, conversationId, content, createdAt),
      );

      return { tempId, inboxSnapshot };
    },
    onSuccess: (messageId, _content, context) => {
      if (!context) return;
      if (!messageId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
        return;
      }
      queryClient.setQueryData<MessagePages>(
        queryKeys.messages(conversationId),
        (current) => replaceMessageId(current, context.tempId, messageId),
      );
    },
    onError: (caught, content, context) => {
      setError(errorMessage(caught));
      onRestoreDraft(content);
      if (!context) return;
      queryClient.setQueryData<MessagePages>(
        queryKeys.messages(conversationId),
        (current) => removeMessage(current, context.tempId),
      );
      if (context.inboxSnapshot) {
        queryClient.setQueryData(queryKeys.inbox, context.inboxSnapshot);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
    },
  });

  const send = (content: string) => {
    if (!content || mutation.isPending) return;
    setError(null);
    mutation.mutate(content);
  };

  const clearError = useCallback(() => setError(null), []);

  return {
    send,
    isPending: mutation.isPending,
    error,
    clearError,
  };
}
