import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  RefreshCw,
} from 'lucide-react';
import { AuthFrame } from '../components/AuthFrame';
import { Monogram } from '../components/Monogram';
import { PrivateWindowNote } from '../components/PrivateWindowNote';
import { useAuth } from '../auth/AuthProvider';
import { api, errorMessage } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

type Mode = 'demo' | 'password';

export function LoginPage() {
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [mode, setMode] = useState<Mode>('demo');
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
      footer={
        <p className="auth__quiet-note mono">
          No demo password is stored in this app. Demo sessions use the seeded-user allowlist on
          the API.
        </p>
      }
    >
      {mode === 'demo' ? (
        <div className="auth-form">
          <div className="auth-form__heading">
            <h1>Step into the desk.</h1>
            <p>
              Six seeded people already have conversations here. Choose a session and the inbox
              opens with their history.
            </p>
          </div>

          <div className="demo-list" aria-live="polite">
            {demoUsers.isPending && (
              <div className="demo-loading" role="status" aria-label="Loading demo sessions">
                {Array.from({ length: 4 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
            )}

            {demoUsers.isError && (
              <div className="demo-unavailable" role="alert">
                <p className="mono">demo access unavailable</p>
                <p>{errorMessage(demoUsers.error)}</p>
                <div className="demo-unavailable__actions">
                  <button
                    type="button"
                    className="button button--ghost button--small"
                    onClick={() => void demoUsers.refetch()}
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                    Try again
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setMode('password')}
                  >
                    Sign in with email instead
                  </button>
                </div>
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
            <p className="form-error" role="alert">
              {demoError}
            </p>
          )}

          <div className="auth-divider">
            <span className="mono">or</span>
          </div>

          <div className="auth-links">
            <button type="button" className="text-button text-button--strong" onClick={() => setMode('password')}>
              <LockKeyhole size={15} aria-hidden="true" />
              Use email and password
            </button>
            <p>
              New here?{' '}
              <Link to="/register" className="inline-link">
                Create a demo account
              </Link>
            </p>
          </div>

          <PrivateWindowNote />
        </div>
      ) : (
        <div className="auth-form">
          <button type="button" className="back-link" onClick={() => setMode('demo')}>
            <ArrowLeft size={15} aria-hidden="true" />
            Back to demo access
          </button>

          <div className="auth-form__heading">
            <h1>Sign in with your email.</h1>
            <p>The demo picker is faster, but the normal cookie login still works.</p>
          </div>

          <form className="form" onSubmit={(event) => void handlePasswordLogin(event)}>
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
                  {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </span>
            </div>

            {loginError && (
              <p className="form-error" role="alert">
                {loginError}
              </p>
            )}

            <button type="submit" className="button button--ink button--wide" disabled={loginPending}>
              {loginPending && <Loader2 className="spin" size={16} aria-hidden="true" />}
              {loginPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-links auth-links--plain">
            No account?{' '}
            <Link to="/register" className="inline-link">
              Register one
            </Link>
          </p>
        </div>
      )}
    </AuthFrame>
  );
}
