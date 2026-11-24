import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/PublicOnlyRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { RouteFallback } from '../components/ui/RouteFallback';

const InboxPage = lazy(() =>
  import('../features/inbox/InboxPage').then((module) => ({ default: module.InboxPage })),
);
const ChatPage = lazy(() =>
  import('../features/chat/ChatPage').then((module) => ({ default: module.ChatPage })),
);
const NewConversationPage = lazy(() =>
  import('../features/new-conversation/NewConversationPage').then((module) => ({
    default: module.NewConversationPage,
  })),
);
const MePage = lazy(() =>
  import('../features/me/MePage').then((module) => ({ default: module.MePage })),
);
const NotFoundPage = lazy(() =>
  import('../features/not-found/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
);

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<WorkspaceLayout />}>
          <Route path="/" element={<Navigate to="/inbox" replace />} />
          <Route
            path="/inbox"
            element={
              <LazyPage>
                <InboxPage />
              </LazyPage>
            }
          />
          <Route
            path="/c/:conversationId"
            element={
              <LazyPage>
                <ChatPage />
              </LazyPage>
            }
          />
          <Route
            path="/new"
            element={
              <LazyPage>
                <NewConversationPage />
              </LazyPage>
            }
          />
          <Route
            path="/me"
            element={
              <LazyPage>
                <MePage />
              </LazyPage>
            }
          />
          <Route
            path="*"
            element={
              <LazyPage>
                <NotFoundPage />
              </LazyPage>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
