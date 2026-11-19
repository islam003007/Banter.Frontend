import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/PublicOnlyRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { WorkspaceLayout } from '../layouts/WorkspaceLayout';
import { InboxPage } from '../features/inbox/InboxPage';
import { ChatPage } from '../features/chat/ChatPage';
import { NewConversationPage } from '../features/new-conversation/NewConversationPage';
import { MePage } from '../features/me/MePage';
import { NotFoundPage } from '../features/not-found/NotFoundPage';

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
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/c/:conversationId" element={<ChatPage />} />
          <Route path="/new" element={<NewConversationPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
