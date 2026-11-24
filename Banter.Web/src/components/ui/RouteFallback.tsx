import { Wordmark } from './Wordmark';

export function RouteFallback() {
  return (
    <div className="splash splash--route" role="status" aria-label="Opening page">
      <div className="splash__inner">
        <Wordmark size="large" />
        <div className="splash__rule" aria-hidden="true">
          <span />
        </div>
        <p className="mono">opening your workspace</p>
      </div>
    </div>
  );
}
