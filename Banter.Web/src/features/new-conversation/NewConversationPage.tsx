import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import type { UserSearchResult } from '../../lib/api/contracts';
import { useRail } from '../../layouts/RailContext';
import { useUserSearch } from './hooks/useUserSearch';
import {
  canCreateConversation,
  selectPerson,
  switchModeSelection,
  type Mode,
} from './model/selection';
import { PeopleSearch } from './components/PeopleSearch';
import { ThreadBuilder } from './components/ThreadBuilder';

export function NewConversationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { drawerOpen, openDrawer } = useRail();
  const [searchParams] = useSearchParams();
  const prefilledSearch = searchParams.get('with')?.trim() ?? '';
  const [mode, setMode] = useState<Mode>('direct');
  const [selected, setSelected] = useState<UserSearchResult[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { search, setSearch, debouncedSearch, query, results, showInitialHint } =
    useUserSearch(prefilledSearch);

  const selectUser = (result: UserSearchResult) => {
    setError(null);
    const outcome = selectPerson(selected, result, mode);
    setSelected(outcome.selected);
    setError(outcome.error);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSelected((current) => switchModeSelection(current, next));
  };

  const removeUser = (id: string) => {
    setSelected((current) => current.filter((person) => person.id !== id));
  };

  const canCreate = canCreateConversation(mode, selected, groupTitle);

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

  return (
    <section className="new-thread page" aria-labelledby="new-thread-title">
      <header className="page__header">
        <button
          type="button"
          className="back-link page__mobile-menu"
          onClick={openDrawer}
          aria-expanded={drawerOpen}
          aria-controls="conversation-rail"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Channels
        </button>
        <p className="mono page__kicker">start a thread</p>
        <h1 id="new-thread-title">Find your people.</h1>
        <p className="page__lede">
          Search the directory, choose a direct message or gather a group. A new thread lands in
          the rail as soon as it exists, even before the first message.
        </p>
      </header>

      <div className="new-thread__grid">
        <PeopleSearch
          mode={mode}
          search={search}
          onSearchChange={setSearch}
          showInitialHint={showInitialHint}
          debouncedSearch={debouncedSearch}
          query={query}
          results={results}
          selected={selected}
          onSelect={selectUser}
          onModeChange={switchMode}
        />

        <ThreadBuilder
          mode={mode}
          selected={selected}
          groupTitle={groupTitle}
          onGroupTitleChange={setGroupTitle}
          onRemove={removeUser}
          error={error}
          canCreate={canCreate}
          pending={pending}
          onCreate={() => void handleCreate()}
        />
      </div>
    </section>
  );
}
