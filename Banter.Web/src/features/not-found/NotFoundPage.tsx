import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <section className="not-found page">
      <p className="mono">404 / no signal</p>
      <h1>This line goes nowhere.</h1>
      <p>The link does not lead anywhere. The desk is still open.</p>
      <Link to="/inbox" className="button button--ink">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to inbox
      </Link>
    </section>
  );
}
