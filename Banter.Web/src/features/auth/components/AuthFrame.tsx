import type { ReactNode } from 'react';
import { Wordmark } from '../../../components/ui/Wordmark';

export function AuthFrame({
  children,
  footer,
  marker = 'access / 01',
}: {
  children: ReactNode;
  footer?: ReactNode;
  marker?: string;
}) {
  return (
    <main className="board">
      <img
        className="board__watermark"
        src="/brand/banter-mark.png"
        alt=""
        aria-hidden="true"
      />

      <header className="board__masthead">
        <Wordmark size="large" className="board__wordmark" />
        <div className="board__masthead-meta mono">
          <span>night signal / 2026</span>
          <span className="board__signal-state">
            <span className="board__signal-state-dot" aria-hidden="true" />
            signal open
          </span>
        </div>
      </header>

      <section className="board__hero" aria-label="Banter">
        <p className="board__kicker mono">live conversation desk / six demo seats</p>
        <h1 className="board__statement">
          The room is <span>already talking.</span>
        </h1>
        <p className="board__copy">
          A live conversation desk with presence you can feel, threads that keep their place, and a
          room that is already talking.
        </p>

        <div className="board__signal" aria-hidden="true">
          <span className="board__signal-line" />
          <span className="board__signal-ticks" />
          <span className="board__signal-scan" />
          <span className="board__signal-point board__signal-point--one">
            <span className="board__signal-node" />
            <span className="board__signal-label mono">presence</span>
          </span>
          <span className="board__signal-point board__signal-point--two">
            <span className="board__signal-node board__signal-node--ink" />
            <span className="board__signal-label mono">typing</span>
          </span>
          <span className="board__signal-point board__signal-point--three">
            <span className="board__signal-node board__signal-node--coral" />
            <span className="board__signal-label mono">delivery</span>
          </span>
        </div>
      </section>

      <div className="board__body">
        <p className="board__marker mono">{marker}</p>
        {children}
      </div>

      <footer className="board__foot">
        {footer ? (
          footer
        ) : (
          <p className="board__quiet-note mono">
            The demo roster needs no password. Choose a name to step straight into the workspace.
          </p>
        )}
        <div className="board__tech mono" aria-label="Workspace features">
          <span>live threads</span>
          <span>group rooms</span>
          <span>presence</span>
          <span>history</span>
        </div>
      </footer>
    </main>
  );
}
