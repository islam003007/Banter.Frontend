import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { RealtimeProvider } from '../realtime/RealtimeProvider';
import { SplashScreen } from '../components/SplashScreen';
import { SessionProblem } from '../components/SessionProblem';

export function ProtectedRoute() {
  const { user, isLoading, error, refreshSession } = useAuth();
  const location = useLocation();

  if (isLoading) return <SplashScreen />;

  if (error && !user) {
    return <SessionProblem message={error.message} onRetry={() => void refreshSession()} />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <RealtimeProvider>
      <Outlet />
    </RealtimeProvider>
  );
}
