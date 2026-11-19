import { ArrowRight, Loader2, X } from 'lucide-react';
import type { UserSearchResult } from '../../../lib/api/contracts';
import { resolveIsBot } from '../../../lib/bots';
import { BotBadge } from '../../../components/ui/BotBadge';
import { Monogram } from '../../../components/ui/Monogram';
import { builderHint, type Mode } from '../model/selection';

interface ThreadBuilderProps {
  mode: Mode;
  selected: UserSearchResult[];
  groupTitle: string;
  onGroupTitleChange: (value: string) => void;
  onRemove: (id: string) => void;
  error: string | null;
  canCreate: boolean;
  pending: boolean;
  onCreate: () => void;
}

export function ThreadBuilder({
  mode,
  selected,
  groupTitle,
  onGroupTitleChange,
  onRemove,
  error,
  canCreate,
  pending,
  onCreate,
}: ThreadBuilderProps) {
  return (
    <aside className="builder" aria-labelledby="builder-title">
      <div className="builder__head">
        <span className="mono">thread draft</span>
        <span className="mono">{mode === 'direct' ? 'direct' : 'group'}</span>
      </div>

      <h2 id="builder-title">{mode === 'direct' ? 'A direct wire.' : 'A group wire.'}</h2>

      {selected.length === 0 ? (
        <p className="builder__empty">
          {mode === 'direct'
            ? 'Search the directory and pick one person or AI teammate.'
            : 'Search the directory and pick at least two people.'}
        </p>
      ) : (
        <ul className="builder__selected">
          {selected.map((person) => {
            const isBot = resolveIsBot(person.isBot, person.displayName);
            return (
              <li key={person.id}>
                <Monogram name={person.displayName} src={person.profilePictureUrl} size="xs" />
                <span className="builder__person">
                  <span className="builder__person-name">{person.displayName}</span>
                  {isBot && <BotBadge />}
                </span>
                <button
                  type="button"
                  className="builder__remove"
                  onClick={() => onRemove(person.id)}
                  aria-label={`Remove ${person.displayName}`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {mode === 'group' && (
        <label className="field field--compact">
          <span className="field__label mono">group name</span>
          <input
            type="text"
            value={groupTitle}
            onChange={(event) => onGroupTitleChange(event.target.value)}
            placeholder="Backend Team"
            maxLength={120}
          />
        </label>
      )}

      <div className="builder__rule" />

      <p className="builder__hint">{builderHint(mode, selected, groupTitle)}</p>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="button button--ink button--wide"
        disabled={!canCreate || pending}
        onClick={onCreate}
      >
        {pending ? (
          <Loader2 className="spin" size={16} aria-hidden="true" />
        ) : (
          <ArrowRight size={16} aria-hidden="true" />
        )}
        {pending
          ? 'Opening thread…'
          : mode === 'direct'
            ? 'Open direct thread'
            : 'Create group thread'}
      </button>
    </aside>
  );
}
