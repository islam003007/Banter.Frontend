import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { AuthFrame } from '../components/AuthFrame';
import { Monogram } from '../components/Monogram';
import { PrivateWindowNote } from '../components/PrivateWindowNote';
import { useAuth } from '../auth/AuthProvider';
import { api, errorMessage } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export function LoginPage() {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [pendingDemoId, setPendingDemoId] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handlePasswordLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoginPending(true);
    setLoginError(null);
    try {
      await api.login(email.trim(), password);
      await finishLogin();
    } catch (error) {
      setLoginError(errorMessage(error));
    } finally {
      setLoginPending(false);
    }
  };

  return (
    <AuthFrame
      marker="access board / 01"
      footer={
        <p className="board__quiet-note mono">
          The demo roster needs no password. Choose a name above to step straight into the
          workspace.
        </p>
      }
    >
      <div className="access">
        <section className="board-section" aria-labelledby="demo-heading">
          <div className="board-section__head">
            <div>
              <p className="mono board-section__index">01 / demo sessions</p>
              <h2 id="demo-heading">Choose a warm seat.</h2>
            </div>
            <p className="board-section__note">
              Six people already have conversations here. Pick one and the inbox opens with their
              history.
            </p>
          </div>

          <div className="demo-board" aria-live="polite">
            {demoUsers.isPending && (
              <div className="demo-loading" role="status" aria-label="Loading demo sessions">
                {Array.from({ length: 6 }).map((_, index) => (
                  <span className="demo-loading__tile" key={index} />
                ))}
              </div>
            )}

            {demoUsers.isError && (
              <div className="demo-unavailable" role="alert">
                <div>
                  <p className="mono">demo access unavailable</p>
                  <p>{errorMessage(demoUsers.error)}</p>
                </div>
                <button
                  type="button"
                  className="button button--ghost button--small"
                  onClick={() => void demoUsers.refetch()}
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  Try again
                </button>
              </div>
            )}

            {users.map((user, index) => {
              const pending = pendingDemoId === user.id;
              const disabled = pendingDemoId !== null;
              return (
                <button
                  key={user.id}
                  type="button"
                  className={`demo-user ${index === 0 ? 'demo-user--lead' : ''} ${
                    pending ? 'is-pending' : ''
                  }`.trim()}
                  onClick={() => void handleDemoLogin(user.id)}
                  disabled={disabled}
                  aria-label={`Continue as ${user.displayName}`}
                >
                  <span className="demo-user__index mono" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Monogram name={user.displayName} src={user.profilePictureUrl} size="md" />
                  <span className="demo-user__identity">
                    <span className="demo-user__name">
                      {user.displayName}
                      {index === 0 && <span className="demo-user__tag mono">start here</span>}
                    </span>
                    <span className="demo-user__email">{user.email}</span>
                  </span>
                  <span className="demo-user__action" aria-hidden="true">
                    {pending ? (
                      <Loader2 className="spin" size={18} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {demoError && (
            <p className="form-error board-form-error" role="alert">
              {demoError}
            </p>
          )}
        </section>

        <section className="board-section board-section--email" aria-labelledby="email-heading">
          <div className="board-section__head">
            <div>
              <p className="mono board-section__index">02 / standard access</p>
              <h2 id="email-heading">Or use your own email.</h2>
            </div>
            <p className="board-section__note">
              The roster is faster, but a real account works here too. New seats are created in
              seconds.
            </p>
          </div>

          <form className="board-form" onSubmit={(event) => void handlePasswordLogin(event)}>
            <label className="field">
              <span className="field__label mono">email</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <div className="field">
              <label className="field__label mono" htmlFor="login-password">
                password
              </label>
              <span className="field__password">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                />
                <button
                  type="button"
                  className="field__reveal"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={17} aria-hidden="true" />
                  ) : (
                    <Eye size={17} aria-hidden="true" />
                  )}
                </button>
              </span>
            </div>

            <button
              type="submit"
              className="button button--ink board-form__submit"
              disabled={loginPending}
            >
              {loginPending && <Loader2 className="spin" size={16} aria-hidden="true" />}
              {loginPending ? 'Signing in…' : 'Sign in'}
            </button>

            {loginError && (
              <p className="form-error board-form-error" role="alert">
                {loginError}
              </p>
            )}
          </form>

          <div className="board-form__foot">
            <div className="board-form__links">
              <p>
                New here?{' '}
                <Link to="/register" className="inline-link">
                  Create a demo account
                </Link>
              </p>
              <p className="mono">cookie session · no credentials stored in this client</p>
            </div>
            <PrivateWindowNote compact />
          </div>
        </section>
      </div>
    </AuthFrame>
  );
}
