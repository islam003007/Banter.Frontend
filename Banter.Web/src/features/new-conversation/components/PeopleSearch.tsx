import { Loader2, Search } from 'lucide-react';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { UserSearchPage, UserSearchResult } from '../../../lib/api/contracts';
import { errorMessage } from '../../../lib/api/errors';
import { BOT_NAMES, BOTS_ENABLED } from '../../../lib/bots';
import { BotBadge } from '../../../components/ui/BotBadge';
import { SearchResultRow } from './SearchResultRow';
import { ModeSwitch } from './ModeSwitch';
import type { Mode } from '../model/selection';

const SUGGESTIONS = ['Sara', 'Mohamed', 'Nour', 'Omar', 'Fatma'];

interface PeopleSearchProps {
  mode: Mode;
  search: string;
  onSearchChange: (value: string) => void;
  showInitialHint: boolean;
  debouncedSearch: string;
  query: UseInfiniteQueryResult<InfiniteData<UserSearchPage, unknown>, Error>;
  results: UserSearchResult[];
  selected: UserSearchResult[];
  onSelect: (result: UserSearchResult) => void;
  onModeChange: (mode: Mode) => void;
}

export function PeopleSearch({
  mode,
  search,
  onSearchChange,
  showInitialHint,
  debouncedSearch,
  query,
  results,
  selected,
  onSelect,
  onModeChange,
}: PeopleSearchProps) {
  return (
    <div className="new-thread__search">
      <ModeSwitch mode={mode} onChange={onModeChange} />

      <label className="search-field">
        <span className="search-field__label mono">find people</span>
        <span className="search-field__control">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or email"
            autoComplete="off"
          />
          {query.isFetching && (
            <Loader2 className="spin search-field__spinner" size={17} aria-hidden="true" />
          )}
        </span>
      </label>

      <p className="search-field__hint mono">
        {mode === 'direct'
          ? BOTS_ENABLED
            ? 'pick one person or AI operator to open a direct channel'
            : 'pick one person to open a direct channel'
          : 'pick two or more people, then name the group'}
      </p>

      {showInitialHint && (
        <div className="search-suggestions">
          <p className="mono">try a name</p>
          <div>
            {SUGGESTIONS.map((name) => (
              <button
                key={name}
                type="button"
                className="search-suggestion"
                onClick={() => onSearchChange(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {BOTS_ENABLED && showInitialHint && (
        <p className="search-bots-note mono">
          <BotBadge />
          <span>{BOT_NAMES} are AI operators. They answer in direct channels.</span>
        </p>
      )}

      {!showInitialHint && query.isPending && (
        <div className="search-loading" role="status" aria-label="Searching for people">
          <span />
          <span />
          <span />
        </div>
      )}

      {!showInitialHint && query.isError && (
        <div className="search-message" role="alert">
          <p>{errorMessage(query.error)}</p>
          <button type="button" className="text-button" onClick={() => void query.refetch()}>
            Try again
          </button>
        </div>
      )}

      {!showInitialHint && query.isSuccess && results.length === 0 && (
        <div className="search-message">
          <p className="mono">no matches</p>
          <p>No one matched “{debouncedSearch}”. Try another name or email.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="search-results" aria-label="Search results">
          {results.map((result) => (
            <SearchResultRow
              key={result.id}
              result={result}
              mode={mode}
              selected={selected.some((person) => person.id === result.id)}
              onSelect={() => onSelect(result)}
            />
          ))}

          {query.hasNextPage && (
            <button
              type="button"
              className="load-more-users"
              onClick={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? 'Loading…' : 'Load more people'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
