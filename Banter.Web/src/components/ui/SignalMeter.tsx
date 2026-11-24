import type { RealtimeState } from '../../lib/api/contracts';

const MAX_BARS = 6;

/**
 * A compact, decorative signal-strength meter. The visible connection label
 * always lives next to it, so the bars stay out of the accessibility tree.
 */
export function SignalMeter({
  state,
  bars = 5,
  className = '',
}: {
  state: RealtimeState;
  bars?: number;
  className?: string;
}) {
  const count = Math.max(1, Math.min(bars, MAX_BARS));

  return (
    <span
      className={`signal-meter signal-meter--${state} ${className}`.trim()}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <span key={index} />
      ))}
    </span>
  );
}
