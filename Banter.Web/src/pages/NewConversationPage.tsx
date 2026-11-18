import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  Loader2,
  Search,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { BOT_NAMES, botPersona, resolveIsBot } from '../lib/bots';
import { queryKeys } from '../lib/queryKeys';
import type { UserSearchResult } from '../lib/types';
import { useAuth } from '../auth/AuthProvider';
import { BotBadge } from '../components/BotBadge';
import { Monogram, PresenceDot } from '../components/Monogram';

type Mode = 'direct' | 'group';

const SUGGESTIONS = ['Sara', 'Mohamed', 'Nour', 'Omar', 'Fatma'];

function dedupeUsers(results: UserSearchResult[]): UserSearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.id)) return false;
    seen.add(result.id);
    return true;
  });
}

export function NewConversationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const prefilledSearch = searchParams.get('with')?.trim() ?? '';
  const [mode, setMode] = useState<Mode>('direct');
  const [search, setSearch] = useState(prefilledSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(prefilledSearch);
  const [selected, setSelected] = useState<UserSearchResult[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const searchQuery = useInfiniteQuery({
    queryKey: queryKeys.userSearch(debouncedSearch),
    queryFn: ({ pageParam }) => api.searchUsers(debouncedSearch, pageParam, 20),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    enabled: debouncedSearch.length >= 2,
    staleTime: 30_000,
  });

  const results = useMemo(() => {
    const all = searchQuery.data?.pages.flatMap((page) => page.users) ?? [];
    return dedupeUsers(all).filter((result) => result.id !== user?.id);
  }, [searchQuery.data, user?.id]);

  const selectUser = (result: UserSearchResult) => {
    setError(null);
    if (mode === 'direct') {
      setSelected([result]);
      return;
    }
    if (resolveIsBot(result.isBot, result.displayName)) {
      setError('AI teammates join direct threads only.');
      return;
    }
    setSelected((current) =>
      current.some((person) => person.id === result.id)
        ? current.filter((person) => person.id !== result.id)
        : [...current, result],
    );
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    if (next === 'direct') {
      setSelected((current) => current.slice(0, 1));
    } else {
      setSelected((current) =>
        current.filter((person) => !resolveIsBot(person.isBot, person.displayName)),
      );
    }
  };

  const removeUser = (id: string) => {
    setSelected((current) => current.filter((person) => person.id !== id));
  };

  const canCreate =
    mode === 'direct'
      ? selected.length === 1
      : selected.length >= 2 && groupTitle.trim().length > 0;
  const directPerson = mode === 'direct' && selected.length === 1 ? selected[0] : null;
  const directIsBot = directPerson
    ? resolveIsBot(directPerson.isBot, directPerson.displayName)
    : false;

  const handleCreate = async () => {
    if (!canCreate || pending) return;
    setPending(true);
    setError(null);
    try {
      const conversationId = await api.createConversation(
        selected.map((person) => person.id),
        mode === 'group' ? groupTitle.trim() : null,
      );
      if (!conversationId) {
        setError('The thread was created, but we could not open it. Check your inbox and try again.');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.inbox });
      navigate(`/c/${conversationId}`);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  const showInitialHint = debouncedSearch.length < 2;

  return (
    <section className="new-thread page" aria-labelledby="new-thread-title">
      <header className="page__header">
        <p className="mono page__kicker">start a thread</p>
        <h1 id="new-thread-title">Find your people.</h1>
        <p className="page__lede">
          Search the directory, choose a direct message or gather a group. A new thread lands in
          your conversations as soon as it exists, even before the first message.
        </p>
      </header>

      <div className="new-thread__grid">
        <div className="new-thread__search">
          <div className="mode-switch" role="group" aria-label="Thread type">
            <button
              type="button"
              className={mode === 'direct' ? 'is-active' : ''}
              aria-pressed={mode === 'direct'}
              onClick={() => switchMode('direct')}
            >
              <UserRound size={16} aria-hidden="true" />
              Direct message
            </button>
            <button
              type="button"
              className={mode === 'group' ? 'is-active' : ''}
              aria-pressed={mode === 'group'}
              onClick={() => switchMode('group')}
            >
              <Users size={16} aria-hidden="true" />
              Group thread
            </button>
          </div>

          <label className="search-field">
            <span className="search-field__label mono">find people</span>
            <span className="search-field__control">
              <Search size={19} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                autoComplete="off"
              />
              {searchQuery.isFetching && <Loader2 className="spin search-field__spinner" size={17} aria-hidden="true" />}
            </span>
          </label>

          <p className="search-field__hint mono">
            {mode === 'direct'
              ? 'pick one person or AI teammate to open a direct thread'
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
                    onClick={() => setSearch(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showInitialHint && (
            <p className="search-bots-note mono">
              <BotBadge />
              <span>{BOT_NAMES} are AI teammates. They answer in direct threads.</span>
            </p>
          )}

          {!showInitialHint && searchQuery.isPending && (
            <div className="search-loading" role="status" aria-label="Searching for people">
              <span />
              <span />
              <span />
            </div>
          )}

          {!showInitialHint && searchQuery.isError && (
            <div className="search-message" role="alert">
              <p>{errorMessage(searchQuery.error)}</p>
              <button type="button" className="text-button" onClick={() => void searchQuery.refetch()}>
                Try again
              </button>
            </div>
          )}

          {!showInitialHint && searchQuery.isSuccess && results.length === 0 && (
            <div className="search-message">
              <p className="mono">no matches</p>
              <p>No one matched “{debouncedSearch}”. Try another name or email.</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="search-results" aria-label="Search results">
              {results.map((result) => {
                const isSelected = selected.some((person) => person.id === result.id);
                const isBot = resolveIsBot(result.isBot, result.displayName);
                const persona = isBot
                  ? botPersona(result.displayName, result.botPersona)
                  : null;
                const unavailable = mode === 'group' && isBot;
                return (
                  <button
                    key={result.id}
                    type="button"
                    className={`search-result ${isSelected ? 'is-selected' : ''} ${
                      unavailable ? 'is-unavailable' : ''
                    }`.trim()}
                    aria-pressed={isSelected}
                    disabled={unavailable}
                    title={
                      unavailable
                        ? `${result.displayName} is an AI teammate and joins direct threads only`
                        : undefined
                    }
                    onClick={() => selectUser(result)}
                  >
                    <span className="search-result__avatar">
                      <Monogram
                        name={result.displayName}
                        src={result.profilePictureUrl}
                        size="sm"
                      />
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
                      <span
                        className={
                          isBot ? 'search-result__persona' : 'search-result__email'
                        }
                      >
                        {isBot ? persona ?? 'AI teammate' : result.email}
                        {unavailable && <span className="search-result__limit"> · DM only</span>}
                      </span>
                    </span>
                    <span className="search-result__check" aria-hidden="true">
                      {unavailable ? (
                        <span className="search-result__plus">–</span>
                      ) : isSelected ? (
                        <Check size={16} />
                      ) : (
                        <span className="search-result__plus">+</span>
                      )}
                    </span>
                  </button>
                );
              })}

              {searchQuery.hasNextPage && (
                <button
                  type="button"
                  className="load-more-users"
                  onClick={() => void searchQuery.fetchNextPage()}
                  disabled={searchQuery.isFetchingNextPage}
                >
                  {searchQuery.isFetchingNextPage ? 'Loading…' : 'Load more people'}
                </button>
              )}
            </div>
          )}
        </div>

        <aside className="builder" aria-labelledby="builder-title">
          <div className="builder__head">
            <span className="mono">thread draft</span>
            <span className="mono">{mode === 'direct' ? 'direct' : 'group'}</span>
          </div>

          <h2 id="builder-title">
            {mode === 'direct' ? 'A direct wire.' : 'A group wire.'}
          </h2>

          {selected.length === 0 ? (
            <p className="builder__empty">
              {mode === 'direct'
                ? 'Search on the left and pick one person or AI teammate.'
                : 'Search on the left and pick at least two people.'}
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
                      onClick={() => removeUser(person.id)}
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
                onChange={(event) => setGroupTitle(event.target.value)}
                placeholder="Backend Team"
                maxLength={120}
              />
            </label>
          )}

          <div className="builder__rule" />

          <p className="builder__hint">
            {mode === 'direct'
              ? selected.length === 1
                ? directIsBot
                  ? `Open a direct thread with ${selected[0].displayName}, an AI teammate.`
                  : `Open a thread with ${selected[0].displayName}.`
                : 'One person is enough for a direct thread.'
              : selected.length < 2
                ? 'A group needs at least two other people.'
                : groupTitle.trim()
                  ? `Create “${groupTitle.trim()}” with ${selected.length} people.`
                  : 'Give the group a name to continue.'}
          </p>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className="button button--ink button--wide"
            disabled={!canCreate || pending}
            onClick={() => void handleCreate()}
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
      </div>
    </section>
  );
}
