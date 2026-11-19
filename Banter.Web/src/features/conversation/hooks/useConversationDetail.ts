import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { queryKeys } from '../../../lib/queryKeys';

export function useConversationDetail(conversationId: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: () => api.getConversation(conversationId),
    staleTime: 30_000,
    retry: 1,
    enabled: Boolean(conversationId) && (options.enabled ?? true),
  });
}
