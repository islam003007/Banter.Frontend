import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { PublicOnlyRoute } from './auth/PublicOnlyRoute';
import { WorkspaceLayout } from './layouts/WorkspaceLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { InboxPage } from './pages/InboxPage';
import { ChatPage } from './pages/ChatPage';
import { NewConversationPage } from './pages/NewConversationPage';
import { MePage } from './pages/MePage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
