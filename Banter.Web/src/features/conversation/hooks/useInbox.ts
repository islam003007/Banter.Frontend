import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { queryKeys } from '../../../lib/queryKeys';

export function useInbox(pageSize = 50) {
  return useQuery({
    queryKey: queryKeys.inbox,
    queryFn: () => api.getInbox(pageSize),
    staleTime: 15_000,
  });
}
