import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { queryKeys } from '../../../lib/queryKeys';
import { flattenMessages } from '../model/timeline';

export function useChatMessages(conversationId: string) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: ({ pageParam }) => api.getMessages(conversationId, pageParam, 30),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    enabled: Boolean(conversationId),
    staleTime: 5_000,
  });

  const messages = useMemo(() => flattenMessages(query.data?.pages), [query.data]);
  const lastSeenMessageId = query.data?.pages[0]?.lastSeenMessageId ?? null;

  return { query, messages, lastSeenMessageId };
}
