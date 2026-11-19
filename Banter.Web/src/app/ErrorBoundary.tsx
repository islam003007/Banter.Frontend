import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Wordmark } from '../components/ui/Wordmark';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Banter render error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="splash" role="alert">
        <div className="splash__inner session-problem">
          <Wordmark size="large" />
          <p className="mono">the desk hit a fault</p>
          <p className="session-problem__message">
            Something in the workspace stopped rendering. Reload to reopen the desk; your session
            stays in this browser.
          </p>
          <button
            type="button"
            className="button button--ink"
            onClick={() => window.location.reload()}
          >
            Reload the desk
          </button>
        </div>
      </div>
    );
  }
}
