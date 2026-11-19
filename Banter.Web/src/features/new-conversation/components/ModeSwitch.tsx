import { UserRound, Users } from 'lucide-react';
import type { Mode } from '../model/selection';

export function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="mode-switch" role="group" aria-label="Thread type">
      <button
        type="button"
        className={mode === 'direct' ? 'is-active' : ''}
        aria-pressed={mode === 'direct'}
        onClick={() => onChange('direct')}
      >
        <UserRound size={16} aria-hidden="true" />
        Direct message
      </button>
      <button
        type="button"
        className={mode === 'group' ? 'is-active' : ''}
        aria-pressed={mode === 'group'}
        onClick={() => onChange('group')}
      >
        <Users size={16} aria-hidden="true" />
        Group thread
      </button>
    </div>
  );
}
