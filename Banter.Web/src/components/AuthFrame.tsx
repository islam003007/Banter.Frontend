import type { ReactNode } from 'react';
import { Wordmark } from './Wordmark';

export function AuthFrame({
  children,
  footer,
  label = 'demo access',
  step = '01 / 02',
}: {
  children: ReactNode;
  footer?: ReactNode;
  label?: string;
  step?: string;
}) {
  return (
    <main className="auth">
      <section className="auth__brand" aria-label="Banter">
        <header className="auth__masthead">
          <Wordmark size="large" />
          <span className="mono auth__build">portfolio build / 2026</span>
        </header>

        <div className="auth__brand-body">
          <p className="auth__statement">The room is already talking.</p>
          <p className="auth__brand-copy">
            A realtime conversation desk built on cookie auth, SignalR delivery, presence, and
            cursor-paginated history.
          </p>
        </div>

        <div className="auth__signal" aria-hidden="true">
          <span className="auth__signal-line" />
          <span className="auth__signal-node auth__signal-node--one" />
          <span className="auth__signal-node auth__signal-node--two" />
          <span className="auth__signal-node auth__signal-node--three" />
          <span className="auth__signal-label mono">signal open</span>
        </div>

        <footer className="auth__tech mono">
          <span>ASP.NET Core 10</span>
          <span>SignalR</span>
          <span>PostgreSQL</span>
          <span>Redis</span>
        </footer>
      </section>

      <section className="auth__panel" aria-label={label}>
        <div className="auth__panel-head">
          <span className="mono">{label}</span>
          <span className="mono auth__step">{step}</span>
        </div>
        <div className="auth__panel-inner">{children}</div>
        {footer && <div className="auth__panel-foot">{footer}</div>}
      </section>
    </main>
  );
}
