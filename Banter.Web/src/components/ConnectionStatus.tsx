import { RefreshCw } from 'lucide-react';
import { useRealtime } from '../realtime/RealtimeProvider';

const labels = {
  connecting: 'linking',
  connected: 'live',
  reconnecting: 'reconnecting',
  disconnected: 'offline',
} as const;

export function ConnectionStatus({ compact = false }: { compact?: boolean }) {
  const { state, retry } = useRealtime();

  return (
    <span
      className={`connection connection--${state} ${compact ? 'connection--compact' : ''}`.trim()}
      role="status"
      aria-live="polite"
      title={
        state === 'connected'
          ? 'SignalR is connected'
          : state === 'connecting'
            ? 'Opening the realtime connection'
            : state === 'reconnecting'
              ? 'The realtime connection dropped; reconnecting'
              : 'Realtime is offline'
      }
    >
      <span className="connection__dot" aria-hidden="true" />
      <span className="connection__label">{labels[state]}</span>
      {state === 'disconnected' && (
        <button type="button" className="connection__retry" onClick={retry}>
          <RefreshCw size={12} aria-hidden="true" />
          retry
        </button>
      )}
    </span>
  );
}
