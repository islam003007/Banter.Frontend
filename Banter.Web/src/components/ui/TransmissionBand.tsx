import type { ReactNode } from 'react';
import { useRealtime } from '../../lib/realtime/RealtimeProvider';
import { SignalMeter } from './SignalMeter';

const STATE_LABELS = {
  connecting: 'linking',
  connected: 'live',
  reconnecting: 'reconnecting',
  disconnected: 'offline',
} as const;

const WAVE_HEIGHTS = [26, 46, 72, 38, 88, 58, 34, 66, 92, 48, 28, 54, 78, 42, 64, 30];

/**
 * The thin transmission band that sits at the top of the main pane.
 * It reports the live connection state and the current channel context
 * without behaving like a second header.
 */
export function TransmissionBand({
  context,
  detail,
  attention = false,
  className = '',
}: {
  context: string;
  detail?: ReactNode;
  attention?: boolean;
  className?: string;
}) {
  const { state } = useRealtime();

  return (
    <div
      className={`transmission transmission--${state} ${
        attention ? 'is-attention' : ''
      } ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span className="transmission__context mono">
        <SignalMeter state={state} bars={4} className="transmission__meter" />
        <span>{context}</span>
      </span>

      <span className="transmission__status mono">
        <span className="transmission__dot" aria-hidden="true" />
        {STATE_LABELS[state]}
      </span>

      {detail && <span className="transmission__detail mono">{detail}</span>}

      <span className="transmission__wave" aria-hidden="true">
        {WAVE_HEIGHTS.map((height, index) => (
          <span
            key={`${height}-${index}`}
            style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
