import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquarePlus, PanelLeft } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { commandKeyLabel } from '../lib/shortcut';
import { useWorkspaceUi } from '../layouts/WorkspaceUiContext';
import { ConnectionStatus } from './ConnectionStatus';
import { Monogram } from './Monogram';
import { Wordmark } from './Wordmark';

function unreadLabel(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function WorkspaceHeader() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { drawerOpen, openDrawer } = useWorkspaceUi();
  const inbox = useQuery({
    queryKey: queryKeys.inbox,
    queryFn: () => api.getInbox(50),
    staleTime: 15_000,
  });

  const conversations = inbox.data?.conversations ?? [];
  const totalUnread = conversations.reduce(
    (sum, conversation) => sum + conversation.unreadCount,
    0,
  );

  return (
    <header className="deskbar">
      <div className="deskbar__brand">
        <Wordmark linked />
        <span className="deskbar__tagline mono">signal desk</span>
      </div>

      <nav className="deskbar__nav" aria-label="Workspace">
        <button
          type="button"
          className={`deskbar__button ${drawerOpen ? 'is-open' : ''}`.trim()}
          aria-expanded={drawerOpen}
          aria-haspopup="dialog"
          aria-controls="conversation-drawer"
          aria-keyshortcuts="Control+K Meta+K"
          aria-label={
            totalUnread > 0 ? `Open conversations, ${totalUnread} unread` : 'Open conversations'
          }
          title={`Open conversations (${commandKeyLabel()})`}
          onClick={() => openDrawer()}
        >
          <PanelLeft size={17} aria-hidden="true" />
          <span className="deskbar__label">Conversations</span>
          {totalUnread > 0 && (
            <span className="deskbar__badge" aria-label={`${totalUnread} unread`}>
              {unreadLabel(totalUnread)}
            </span>
          )}
          <span className="deskbar__shortcut" aria-hidden="true">
            {commandKeyLabel()}
          </span>
        </button>

        <Link
          to="/new"
          className={`deskbar__new ${pathname === '/new' ? 'is-current' : ''}`.trim()}
          aria-label="New thread"
          title="Start a new thread"
        >
          <MessageSquarePlus size={17} aria-hidden="true" />
          <span className="deskbar__label">New thread</span>
        </Link>
      </nav>

      <div className="deskbar__right">
        <ConnectionStatus />
        {user && (
          <Link
            to="/me"
            className={`deskbar__session ${pathname === '/me' ? 'is-current' : ''}`.trim()}
            aria-label="Your session"
            title="Your session"
          >
            <Monogram name={user.displayName} src={user.profilePictureUrl} size="xs" />
            <span className="deskbar__session-text">
              <span className="deskbar__session-name">{user.displayName}</span>
              <span className="mono">your session</span>
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
