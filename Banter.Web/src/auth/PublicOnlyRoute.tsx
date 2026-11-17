import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { SplashScreen } from '../components/SplashScreen';

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (isLoading) return <SplashScreen />;
  if (user) return <Navigate to={from && from !== '/login' ? from : '/inbox'} replace />;
  return <>{children}</>;
}
