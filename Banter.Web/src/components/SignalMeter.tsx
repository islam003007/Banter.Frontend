import type { RealtimeState } from '../lib/types';

const METER_HEIGHTS = [34, 58, 82, 100, 64, 46];

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
  const heights = METER_HEIGHTS.slice(0, Math.max(1, Math.min(bars, METER_HEIGHTS.length)));

  return (
    <span
      className={`signal-meter signal-meter--${state} ${className}`.trim()}
      aria-hidden="true"
    >
      {heights.map((height, index) => (
        <span
          key={height + index}
          style={{ height: `${height}%`, animationDelay: `${index * 120}ms` }}
        />
      ))}
    </span>
  );
}
