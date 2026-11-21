import { Link, useLocation } from 'react-router-dom';
import { MessageSquarePlus, Radio, X } from 'lucide-react';
import { errorMessage } from '../../lib/api/errors';
import { conversationIdFromPath } from '../../lib/realtime/normalize';
import { useAuth } from '../auth/AuthProvider';
import { useRail } from '../../layouts/RailContext';
import { useRealtime } from '../../lib/realtime/RealtimeProvider';
import { useInbox } from '../conversation/hooks/useInbox';
import { Monogram, PresenceDot } from '../../components/ui/Monogram';
import { ConnectionStatus } from '../../components/ui/ConnectionStatus';
import { LoadingRows } from '../../components/ui/PageState';
import { PrivateWindowNote } from '../../components/ui/PrivateWindowNote';
import { SignalMeter } from '../../components/ui/SignalMeter';
import { Wordmark } from '../../components/ui/Wordmark';
import { ChannelRow } from './components/ChannelRow';

export function ChannelRail() {
  const { user } = useAuth();
  const location = useLocation();
  const { drawerOpen, closeDrawer } = useRail();
  const { state: realtimeState } = useRealtime();
  const currentId = conversationIdFromPath(location.pathname);
  const inbox = useInbox();

  const conversations = inbox.data?.conversations ?? [];
  const totalUnread = conversations.reduce(
    (sum, conversation) => sum + conversation.unreadCount,
    0,
  );

  return (
    <aside
      className="rail"
      id="conversation-rail"
      aria-label="Channel rail"
      role={drawerOpen ? 'dialog' : undefined}
      aria-modal={drawerOpen ? true : undefined}
    >
      <header className="rail__masthead">
        <div className="rail__brand-row">
          <Link to="/inbox" className="rail__brand" onClick={closeDrawer} aria-label="Banter inbox">
            <Wordmark size="small" />
          </Link>
          <button
            type="button"
            className="icon-button rail__close"
            onClick={closeDrawer}
            aria-label="Close channels"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="rail__desk">
          <span className="rail__desk-name">
            <span className={`rail__desk-pip is-${realtimeState}`} aria-hidden="true" />
            Night desk
          </span>
          <span className="rail__desk-meter">
            <SignalMeter state={realtimeState} bars={5} />
            <ConnectionStatus compact />
          </span>
        </div>
      </header>

      <div className="rail__toolbar">
        <Link to="/new" className="new-thread-button" onClick={closeDrawer}>
          <span className="new-thread-button__icon">
            <MessageSquarePlus size={17} aria-hidden="true" />
          </span>
          <span>New channel</span>
          <span className="new-thread-button__hint mono" aria-hidden="true">
            <Radio size={12} />
          </span>
        </Link>
      </div>

      <div className="rail__heading">
        <h2 className="mono">Channel index</h2>
        <span className="rail__heading-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="mono rail__count" role="status" aria-live="polite">
          {inbox.isSuccess && conversations.length > 0
            ? totalUnread > 0
              ? `${totalUnread} unread`
              : `${conversations.length} open`
            : 'desk'}
        </span>
      </div>

      <div className="rail__scroll">
        {inbox.isPending && <LoadingRows count={5} />}

        {inbox.isError && (
          <div className="rail__error" role="alert">
            <p className="mono">the desk didn’t load</p>
            <p>{errorMessage(inbox.error)}</p>
            <button type="button" className="text-button" onClick={() => void inbox.refetch()}>
              Try again
            </button>
          </div>
        )}

        {inbox.isSuccess && conversations.length === 0 && (
          <div className="rail__empty">
            <p className="mono">no channels yet</p>
            <h3>Start a channel.</h3>
            <p>Search for a person and open a direct channel, or gather a few people into a group.</p>
            <Link to="/new" className="button button--primary button--small" onClick={closeDrawer}>
              Find someone
            </Link>
          </div>
        )}

        {conversations.length > 0 && (
          <nav className="conversation-list" aria-label="Channels">
            {conversations.map((conversation, index) => (
              <ChannelRow
                key={conversation.conversationId}
                conversation={conversation}
                index={index}
                active={conversation.conversationId === currentId}
                onNavigate={closeDrawer}
              />
            ))}
          </nav>
        )}
      </div>

      <footer className="rail__footer">
        {user && (
          <Link to="/me" className="rail__account" onClick={closeDrawer} aria-label="Your session">
            <span className="rail__account-avatar">
              <Monogram name={user.displayName} src={user.profilePictureUrl} size="xs" />
              <PresenceDot online label="You are online" />
            </span>
            <span className="rail__account-text">
              <span className="rail__account-name">{user.displayName}</span>
              <span className="mono">operator seat</span>
            </span>
            <span className="rail__account-signal" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </Link>
        )}
        <PrivateWindowNote compact />
      </footer>
    </aside>
  );
}

/** Kept for callers that still import the old component name. */
export { ChannelRail as ConversationRail };
