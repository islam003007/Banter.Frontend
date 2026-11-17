import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, MessageSquarePlus, PenLine } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { firstName } from '../lib/format';
import { queryKeys } from '../lib/queryKeys';
import { PrivateWindowNote } from '../components/PrivateWindowNote';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function InboxPage() {
  const { user } = useAuth();
  const inbox = useQuery({
    queryKey: queryKeys.inbox,
    queryFn: () => api.getInbox(50),
    staleTime: 15_000,
  });

  const conversations = inbox.data?.conversations ?? [];
  const unreadTotal = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  const latest = conversations[0];

  return (
    <section className="welcome" aria-labelledby="welcome-heading">
      <div className="welcome__top">
        <p className="welcome__kicker mono">
          signal desk <span aria-hidden="true">/</span> live workspace
        </p>
        <p className="welcome__date mono">
          {new Intl.DateTimeFormat('en', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }).format(new Date())}
        </p>
      </div>

      <div className="welcome__stage">
        <p className="welcome__hello mono">{greeting()},</p>
        <h1 id="welcome-heading" className="welcome__title">
          {firstName(user?.displayName)}.
        </h1>
        <p className="welcome__lede">
          The desk is open. Pick a conversation from the rail, or find someone and start a new
          wire.
        </p>

        <div className="welcome__actions">
          {latest ? (
            <Link to={`/c/${latest.conversationId}`} className="button button--ink">
              Open {latest.displayName}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          ) : (
            <Link to="/new" className="button button--ink">
              Start the first thread
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          )}
          <Link to="/new" className="button button--ghost">
            <MessageSquarePlus size={16} aria-hidden="true" />
            New thread
          </Link>
        </div>

        <dl className="welcome__ledger">
          <div>
            <dt className="mono">unread</dt>
            <dd>{unreadTotal > 0 ? String(unreadTotal).padStart(2, '0') : '—'}</dd>
          </div>
          <div>
            <dt className="mono">threads</dt>
            <dd>{String(conversations.length).padStart(2, '0')}</dd>
          </div>
          <div>
            <dt className="mono">transport</dt>
            <dd className="welcome__ledger-word">SignalR</dd>
          </div>
        </dl>
      </div>

      <aside className="welcome__aside" aria-label="Demo notes">
        <div className="welcome__mark" aria-hidden="true">
          <span className="welcome__mark-ring welcome__mark-ring--one" />
          <span className="welcome__mark-ring welcome__mark-ring--two" />
          <span className="welcome__mark-core" />
          <PenLine size={18} />
        </div>
        <blockquote>
          “A thread is a live wire. Keep both ends open.”
        </blockquote>
        <p className="welcome__aside-caption mono">field note, signal desk</p>
        <PrivateWindowNote />
      </aside>

      <footer className="welcome__footer mono">
        <span>banter / demo workspace</span>
        <span>REST + cookies + websockets</span>
      </footer>
    </section>
  );
}
