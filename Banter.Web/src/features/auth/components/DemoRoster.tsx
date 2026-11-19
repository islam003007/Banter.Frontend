import { ArrowUpRight, Loader2, RefreshCw } from 'lucide-react';
import type { DemoUser } from '../../../lib/api/contracts';
import { errorMessage } from '../../../lib/api/errors';
import { Monogram } from '../../../components/ui/Monogram';

interface DemoRosterProps {
  users: DemoUser[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  pendingDemoId: string | null;
  demoError: string | null;
  onChoose: (userId: string) => void;
}

export function DemoRoster({
  users,
  isPending,
  isError,
  error,
  onRetry,
  pendingDemoId,
  demoError,
  onChoose,
}: DemoRosterProps) {
  return (
    <section className="board-section" aria-labelledby="demo-heading">
      <div className="board-section__head">
        <div>
          <p className="mono board-section__index">01 / demo sessions</p>
          <h2 id="demo-heading">Choose a seat.</h2>
        </div>
        <p className="board-section__note">
          Six people already have conversations here. Pick one and the inbox opens with their
          history.
        </p>
      </div>

      <div className="demo-board" aria-live="polite">
        {isPending && (
          <div className="demo-loading" role="status" aria-label="Loading demo sessions">
            {Array.from({ length: 6 }).map((_, index) => (
              <span className="demo-loading__tile" key={index} />
            ))}
          </div>
        )}

        {isError && (
          <div className="demo-unavailable" role="alert">
            <div>
              <p className="mono">demo access unavailable</p>
              <p>{errorMessage(error)}</p>
            </div>
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={onRetry}
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
              onClick={() => onChoose(user.id)}
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
                {pending ? <Loader2 className="spin" size={18} /> : <ArrowUpRight size={18} />}
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
  );
}
