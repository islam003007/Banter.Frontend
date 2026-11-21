import type { ReactNode } from 'react';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div className="loading-rows" role="status" aria-label="Loading channels">
      {Array.from({ length: count }).map((_, index) => (
        <div className="loading-row" key={index}>
          <span className="loading-row__avatar" />
          <span className="loading-row__body">
            <span className="loading-row__line loading-row__line--name" />
            <span className="loading-row__line" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  title = 'This part of the desk didn’t load.',
  message,
  onRetry,
  backTo,
  backLabel = 'Back',
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <div className="state-panel" role="alert">
      <span className="state-panel__icon">
        <AlertCircle size={22} aria-hidden="true" />
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
      <div className="state-panel__actions">
        {onRetry && (
          <button type="button" className="button button--ink" onClick={onRetry}>
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
        )}
        {backTo && (
          <Link to={backTo} className="button button--ghost">
            <ArrowLeft size={15} aria-hidden="true" />
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="state-panel state-panel--empty">
      {icon && <span className="state-panel__icon state-panel__icon--lime">{icon}</span>}
      <h2>{title}</h2>
      <p>{message}</p>
      {action && <div className="state-panel__actions">{action}</div>}
    </div>
  );
}
