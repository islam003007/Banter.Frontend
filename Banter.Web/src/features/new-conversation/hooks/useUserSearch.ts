import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { queryKeys } from '../../../lib/queryKeys';
import { useAuth } from '../../auth/AuthProvider';
import { dedupeUsers } from '../model/selection';

export const SEARCH_DEBOUNCE_MS = 300;

export function useUserSearch(initialSearch: string) {
  const { user } = useAuth();
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch.trim());

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useInfiniteQuery({
    queryKey: queryKeys.userSearch(debouncedSearch),
    queryFn: ({ pageParam }) => api.searchUsers(debouncedSearch, pageParam, 20),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    enabled: debouncedSearch.length >= 2,
    staleTime: 30_000,
  });

  const results = useMemo(() => {
    const all = query.data?.pages.flatMap((page) => page.users) ?? [];
    return dedupeUsers(all).filter((result) => result.id !== user?.id);
  }, [query.data, user?.id]);

  return {
    search,
    setSearch,
    debouncedSearch,
    query,
    results,
    showInitialHint: debouncedSearch.length < 2,
  };
}
