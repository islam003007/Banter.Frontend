import { Wordmark } from './Wordmark';

export function SplashScreen() {
  return (
    <div className="splash" role="status" aria-label="Checking your session">
      <div className="splash__inner">
        <Wordmark size="large" />
        <div className="splash__rule" aria-hidden="true">
          <span />
        </div>
        <p className="mono">opening the night desk</p>
      </div>
    </div>
  );
}
