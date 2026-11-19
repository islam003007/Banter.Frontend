import { AppWindow } from 'lucide-react';

export function PrivateWindowNote({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`private-note ${compact ? 'private-note--compact' : ''}`.trim()}>
      <AppWindow size={15} aria-hidden="true" />
      <span>
        To watch realtime, sign in as Ahmed here, then open a private window and continue as Sara.
        Messages cross between them live.
      </span>
    </p>
  );
}
