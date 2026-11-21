import { AppWindow } from 'lucide-react';

export function PrivateWindowNote({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`private-note ${compact ? 'private-note--compact' : ''}`.trim()}>
      <AppWindow size={15} aria-hidden="true" />
      <span>
        To see live delivery, sign in as Ahmed here, then open a private window and sign in as
        Sara. Messages appear in both windows.
      </span>
    </p>
  );
}
