import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import type { CurrentUser } from '../../lib/api/contracts';

interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  error: Error | null;
  refreshSession: () => Promise<CurrentUser | null>;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: api.getSession,
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const refreshSession = useCallback(async () => {
    const result = await sessionQuery.refetch();
    if (result.error) throw result.error;
    return result.data ?? null;
  }, [sessionQuery.refetch]);

  const clearSession = useCallback(() => {
    queryClient.setQueryData(queryKeys.session, null);
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== queryKeys.session[0],
    });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: sessionQuery.data ?? null,
      isLoading: sessionQuery.isPending,
      error: sessionQuery.error instanceof Error ? sessionQuery.error : null,
      refreshSession,
      clearSession,
    }),
    [sessionQuery.data, sessionQuery.isPending, sessionQuery.error, refreshSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
