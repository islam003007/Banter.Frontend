import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { useAuth } from './AuthProvider';
import { AuthFrame } from './components/AuthFrame';
import { DemoRoster } from './components/DemoRoster';
import { PasswordLoginForm } from './components/PasswordLoginForm';

export function LoginPage() {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [pendingDemoId, setPendingDemoId] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const demoUsers = useQuery({
    queryKey: queryKeys.demoUsers,
    queryFn: api.getDemoUsers,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const users = [...(demoUsers.data ?? [])].sort((left, right) => {
    const leftFirst = left.displayName.toLowerCase() === 'ahmed' ? 1 : 0;
    const rightFirst = right.displayName.toLowerCase() === 'ahmed' ? 1 : 0;
    return rightFirst - leftFirst;
  });

  const destination = from && from !== '/login' ? from : '/inbox';

  const finishLogin = async () => {
    await refreshSession();
    navigate(destination, { replace: true });
  };

  const handleDemoLogin = async (userId: string) => {
    setPendingDemoId(userId);
    setDemoError(null);
    try {
      await api.demoLogin(userId);
      await finishLogin();
    } catch (error) {
      setDemoError(errorMessage(error));
    } finally {
      setPendingDemoId(null);
    }
  };

  const handlePasswordLogin = async (email: string, password: string) => {
    setLoginPending(true);
    setLoginError(null);
    try {
      await api.login(email, password);
      await finishLogin();
    } catch (error) {
      setLoginError(errorMessage(error));
    } finally {
      setLoginPending(false);
    }
  };

  return (
    <AuthFrame
      marker="access / 01"
      footer={
        <p className="board__quiet-note mono">
          The demo roster needs no password. Choose a name above to step straight into the
          workspace.
        </p>
      }
    >
      <div className="access">
        <DemoRoster
          users={users}
          isPending={demoUsers.isPending}
          isError={demoUsers.isError}
          error={demoUsers.error}
          onRetry={() => void demoUsers.refetch()}
          pendingDemoId={pendingDemoId}
          demoError={demoError}
          onChoose={(userId) => void handleDemoLogin(userId)}
        />

        <section className="board-section board-section--email" aria-labelledby="email-heading">
          <div className="board-section__head">
            <div>
              <p className="mono board-section__index">02 / standard access</p>
              <h2 id="email-heading">Or use your own email.</h2>
            </div>
            <p className="board-section__note">
              The demo roster is the quickest way in. You can also sign in with email below.
            </p>
          </div>

          <PasswordLoginForm
            pending={loginPending}
            error={loginError}
            onLogin={(email, password) => void handlePasswordLogin(email, password)}
          />
        </section>
      </div>
    </AuthFrame>
  );
}
