import { useState } from 'react';
import { initials, monogramTone } from '../lib/format';

interface MonogramProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  group?: boolean;
  className?: string;
}

export function Monogram({ name, src, size = 'md', group = false, className = '' }: MonogramProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const tone = group ? 'tone-group' : monogramTone(name);

  return (
    <span
      className={`monogram monogram--${size} ${tone} ${className}`.trim()}
      aria-hidden="true"
    >
      {src && !imageFailed ? (
        <img src={src} alt="" onError={() => setImageFailed(true)} />
      ) : (
        <span className="monogram__letters">{initials(name)}</span>
      )}
    </span>
  );
}

export function PresenceDot({ online, label }: { online: boolean; label?: string }) {
  return (
    <span
      className={`presence-dot ${online ? 'is-online' : 'is-offline'}`.trim()}
      title={label ?? (online ? 'Online' : 'Offline')}
      role="img"
      aria-label={label ?? (online ? 'Online' : 'Offline')}
    />
  );
}
