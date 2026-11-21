import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquarePlus } from 'lucide-react';
import type { InboxConversation } from '../../../lib/api/contracts';
import { greeting, padCount } from '../model/inboxSummary';

interface WelcomeHeroProps {
  displayName: string | null | undefined;
  isPending: boolean;
  unreadTotal: number;
  channelsCount: number;
  liveNow: number;
  latest: InboxConversation | undefined;
}

function firstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] || 'there';
}

export function WelcomeHero({
  displayName,
  isPending,
  unreadTotal,
  channelsCount,
  liveNow,
  latest,
}: WelcomeHeroProps) {
  return (
    <div className="welcome__stage">
      <p className="welcome__hello mono">{greeting()},</p>
      <h1 id="welcome-heading" className="welcome__title">
        {firstName(displayName)}.
      </h1>
      <p className="welcome__lede">
        The desk is open. Pick a channel from the rail, or find someone and open a new channel.
      </p>

      <div className="welcome__actions">
        {latest ? (
          <Link to={`/c/${latest.conversationId}`} className="button button--ink">
            Open {latest.displayName}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        ) : (
          <Link to="/new" className="button button--ink">
            Start a channel
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        )}
        <Link to="/new" className="button button--ghost">
          <MessageSquarePlus size={16} aria-hidden="true" />
          New channel
        </Link>
      </div>

      <dl className="welcome__ledger">
        <div>
          <dt className="mono">unread</dt>
          <dd className={unreadTotal > 0 ? 'is-unread' : undefined}>
            {isPending ? '—' : unreadTotal > 0 ? padCount(unreadTotal) : '00'}
          </dd>
        </div>
        <div>
          <dt className="mono">channels</dt>
          <dd>{isPending ? '—' : padCount(channelsCount)}</dd>
        </div>
        <div>
          <dt className="mono">live now</dt>
          <dd className={liveNow > 0 ? 'is-live' : undefined}>
            {isPending ? '—' : liveNow > 0 ? padCount(liveNow) : '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
