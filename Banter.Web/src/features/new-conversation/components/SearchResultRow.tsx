import { Check } from 'lucide-react';
import type { UserSearchResult } from '../../../lib/api/contracts';
import { BotBadge } from '../../../components/ui/BotBadge';
import { Monogram, PresenceDot } from '../../../components/ui/Monogram';
import { resultPresentation, type Mode } from '../model/selection';

export function SearchResultRow({
  result,
  mode,
  selected,
  onSelect,
}: {
  result: UserSearchResult;
  mode: Mode;
  selected: boolean;
  onSelect: () => void;
}) {
  const { isBot, persona, unavailable } = resultPresentation(result, mode);

  return (
    <button
      type="button"
      className={`search-result ${selected ? 'is-selected' : ''} ${
        unavailable ? 'is-unavailable' : ''
      }`.trim()}
      aria-pressed={selected}
      disabled={unavailable}
      title={
        unavailable
          ? `${result.displayName} is an AI operator and joins direct channels only`
          : undefined
      }
      onClick={onSelect}
    >
      <span className="search-result__avatar">
        <Monogram name={result.displayName} src={result.profilePictureUrl} size="sm" />
        {!isBot && (
          <PresenceDot
            online={result.isOnline}
            label={`${result.displayName} is ${result.isOnline ? 'online' : 'offline'}`}
          />
        )}
      </span>
      <span className="search-result__identity">
        <span className="search-result__name-row">
          <span className="search-result__name">{result.displayName}</span>
          {isBot && <BotBadge />}
        </span>
        <span className={isBot ? 'search-result__persona' : 'search-result__email'}>
          {isBot ? persona ?? 'AI operator' : result.email}
          {unavailable && <span className="search-result__limit"> · Direct only</span>}
        </span>
      </span>
      <span className="search-result__check" aria-hidden="true">
        {unavailable ? (
          <span className="search-result__plus">–</span>
        ) : selected ? (
          <Check size={16} />
        ) : (
          <span className="search-result__plus">+</span>
        )}
      </span>
    </button>
  );
}
