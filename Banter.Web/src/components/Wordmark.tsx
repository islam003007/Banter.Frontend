import { Link } from 'react-router-dom';

interface WordmarkProps {
  size?: 'small' | 'large' | 'hero';
  linked?: boolean;
  className?: string;
}

function Mark({ size, className = '' }: Omit<WordmarkProps, 'linked'>) {
  return (
    <span className={`wordmark wordmark--${size ?? 'small'} ${className}`.trim()}>
      <span className="wordmark__letters">banter</span>
      <span className="wordmark__dot" aria-hidden="true" />
    </span>
  );
}

export function Wordmark({ size = 'small', linked = false, className }: WordmarkProps) {
  if (linked) {
    return (
      <Link to="/inbox" className="wordmark-link" aria-label="Banter inbox">
        <Mark size={size} className={className} />
      </Link>
    );
  }
  return <Mark size={size} className={className} />;
}
