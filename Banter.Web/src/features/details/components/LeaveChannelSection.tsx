import { useState } from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { errorMessage } from '../../../lib/api/errors';

interface LeaveChannelSectionProps {
  isGroup: boolean;
  displayName: string;
  pending: boolean;
  error: unknown;
  hasError: boolean;
  onLeave: () => void;
}

export function LeaveChannelSection({
  isGroup,
  displayName,
  pending,
  error,
  hasError,
  onLeave,
}: LeaveChannelSectionProps) {
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  return (
    <section className="details-section details-section--leave" aria-labelledby="leave-heading">
      <div className="details-section__header">
        <h3 id="leave-heading">Leave channel</h3>
      </div>
      {!isGroup && (
        <p className="details-muted">
          Direct channels are shared by both people. Leave is only available for group channels.
        </p>
      )}
      {isGroup && (
        <>
          {!confirmingLeave ? (
            <button
              type="button"
              className="button button--outline-danger"
              onClick={() => setConfirmingLeave(true)}
            >
              <LogOut size={16} aria-hidden="true" />
              Leave channel
            </button>
          ) : (
            <div className="leave-confirm">
              <p>
                <AlertTriangle size={16} aria-hidden="true" />
                Leave “{displayName}”? The channel disappears from your inbox.
              </p>
              <div className="leave-confirm__actions">
                <button
                  type="button"
                  className="button button--danger"
                  disabled={pending}
                  onClick={onLeave}
                >
                  {pending ? 'Leaving…' : 'Yes, leave'}
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setConfirmingLeave(false)}
                >
                  Stay
                </button>
              </div>
            </div>
          )}
          {hasError && (
            <p className="form-error" role="alert">
              {errorMessage(error)}
            </p>
          )}
        </>
      )}
    </section>
  );
}
