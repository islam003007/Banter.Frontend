import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useRail } from '../../layouts/RailContext';
import { Monogram } from '../../components/ui/Monogram';
import { ConnectionStatus } from '../../components/ui/ConnectionStatus';
import { PrivateWindowNote } from '../../components/ui/PrivateWindowNote';
import { useAuth } from '../auth/AuthProvider';

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
          Channels
        </button>
        <p className="mono page__kicker">your seat</p>
      </header>

      <div className="session-page__grid">
        <div className="session-card">
          <div className="session-card__identity">
            <Monogram name={user.displayName} src={user.profilePictureUrl} size="xl" />
            <div>
              <h1 id="session-title">{user.displayName}</h1>
              <p className="mono">seated at the night desk</p>
            </div>
          </div>

          <dl className="session-facts">
            <div>
              <dt className="mono">email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="mono">live</dt>
              <dd className="session-facts__realtime">
                <ConnectionStatus />
                <span className="mono">new messages arrive as they are sent</span>
              </dd>
            </div>
            <div>
              <dt className="mono">privacy</dt>
              <dd>Your sign-in stays in this browser until you log out.</dd>
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
          <p className="mono">a note on this demo</p>
          <h2>A room built to be shared.</h2>
          <p>
            This is a shared demo workspace. Messages are delivered to everyone in a thread, and
            the resident cast is here so the room never starts empty.
          </p>
          <PrivateWindowNote />
          <p className="session-note__signoff mono">
            Logging out closes your seat on this browser. The rest of the room stays open.
          </p>
        </aside>
      </div>
    </section>
  );
}
