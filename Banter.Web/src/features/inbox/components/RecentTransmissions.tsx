import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { errorMessage } from '../../../lib/api/errors';
import type { InboxConversation } from '../../../lib/api/contracts';
import { ThreadCard } from './ThreadCard';
import { ThreadSkeleton } from './ThreadSkeleton';
import { BOTS_ENABLED } from '../../../lib/bots';

interface RecentTransmissionsProps {
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: unknown;
  onRetry: () => void;
  threads: InboxConversation[];
  latestSignal: string;
}

export function RecentTransmissions({
  isPending,
  isError,
  isSuccess,
  error,
  onRetry,
  threads,
  latestSignal,
}: RecentTransmissionsProps) {
  return (
    <section className="welcome__activity" aria-labelledby="welcome-activity-title">
      <div className="welcome__section-head">
        <div>
          <p className="mono">recent transmissions</p>
          <h2 id="welcome-activity-title">Pick up where you left off.</h2>
        </div>
        <p className="mono welcome__section-meta">
          {isPending
            ? 'reading the desk'
            : latestSignal
              ? `last signal ${latestSignal}`
              : 'no signals yet'}
        </p>
      </div>

      {isPending && (
        <div className="welcome__threads" role="status" aria-label="Loading recent channels">
          <ThreadSkeleton />
          <ThreadSkeleton />
          <ThreadSkeleton />
        </div>
      )}

      {isError && (
        <div className="welcome__error" role="alert">
          <div>
            <p className="mono">the desk didn’t load</p>
            <p>{errorMessage(error)}</p>
          </div>
          <button type="button" className="text-button" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}

      {isSuccess && threads.length === 0 && (
        <div className="welcome__empty">
          <span className="welcome__empty-icon">
            <Radio size={18} aria-hidden="true" />
          </span>
          <div>
            <h3>No channels on the desk yet.</h3>
            <p>
              {BOTS_ENABLED
                ? 'Open a channel with someone, or visit the AI desk and ask a first question.'
                : 'Open a channel with someone and start the conversation.'}
            </p>
          </div>
          <Link to="/new" className="button button--ink button--small">
            Find someone
          </Link>
        </div>
      )}

      {threads.length > 0 && (
        <div className="welcome__threads">
          {threads.map((conversation, index) => (
            <ThreadCard key={conversation.conversationId} conversation={conversation} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
