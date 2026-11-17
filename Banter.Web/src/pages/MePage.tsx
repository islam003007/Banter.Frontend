import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { api, errorMessage } from '../lib/api';
import { useRail } from '../layouts/RailContext';
import { Monogram } from '../components/Monogram';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { PrivateWindowNote } from '../components/PrivateWindowNote';

export function MePage() {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();
  const { drawerOpen, openDrawer } = useRail();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setPending(true);
    setError(null);
    try {
      await api.logout();
      clearSession();
      navigate('/login', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
      setPending(false);
    }
  };

  if (!user) return null;

  return (
    <section className="session-page page" aria-labelledby="session-title">
      <header className="page__header">
        <button
          type="button"
          className="back-link page__mobile-menu"
          onClick={openDrawer}
          aria-expanded={drawerOpen}
          aria-controls="conversation-rail"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Conversations
        </button>
        <p className="mono page__kicker">your session</p>
      </header>

      <div className="session-page__grid">
        <div className="session-card">
          <div className="session-card__identity">
            <Monogram name={user.displayName} src={user.profilePictureUrl} size="xl" />
            <div>
              <h1 id="session-title">{user.displayName}</h1>
              <p className="mono">seated at the signal desk</p>
            </div>
          </div>

          <dl className="session-facts">
            <div>
              <dt className="mono">email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="mono">session</dt>
              <dd>ASP.NET Identity cookie</dd>
            </div>
            <div>
              <dt className="mono">realtime</dt>
              <dd className="session-facts__realtime">
                <ConnectionStatus />
                <span className="mono">/hubs/chat</span>
              </dd>
            </div>
            <div>
              <dt className="mono">user id</dt>
              <dd className="session-facts__id">{user.id}</dd>
            </div>
          </dl>

          <div className="session-card__actions">
            <button
              type="button"
              className="button button--ink"
              onClick={() => void handleLogout()}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="spin" size={16} aria-hidden="true" />
              ) : (
                <LogOut size={16} aria-hidden="true" />
              )}
              {pending ? 'Closing session…' : 'Log out'}
            </button>
            <Link to="/inbox" className="button button--ghost">
              Back to inbox
            </Link>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <aside className="session-note">
          <p className="mono">how this demo works</p>
          <h2>One API, two windows.</h2>
          <p>
            Every browser session is a real Identity cookie. The websocket connection registers
            presence and receives messages through SignalR; the inbox and history use the REST
            endpoints.
          </p>
          <PrivateWindowNote />
          <p className="session-note__signoff mono">
            Logging out clears this browser session only. The seeded users stay exactly as they
            were.
          </p>
        </aside>
      </div>
    </section>
  );
}
