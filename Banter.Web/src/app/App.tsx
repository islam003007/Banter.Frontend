import { AuthProvider } from '../features/auth/AuthProvider';
import { AppRoutes } from './AppRoutes';
import { ErrorBoundary } from './ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}
