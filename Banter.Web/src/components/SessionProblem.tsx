import { RefreshCw } from 'lucide-react';
import { Wordmark } from './Wordmark';

export function SessionProblem({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="splash">
      <div className="splash__inner session-problem">
        <Wordmark size="large" />
        <p className="mono">the desk did not answer</p>
        <p className="session-problem__message">{message}</p>
        <button type="button" className="button button--ink" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}
