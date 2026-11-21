import { createRef, type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApiError } from '../../../lib/api/errors';
import type { ChatMessage } from '../../../lib/api/contracts';
import { MessageList } from './MessageList';

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm1',
    content: 'hello',
    createdAt: new Date(2026, 4, 29, 10, 0).toISOString(),
    userId: 'user-mohamed',
    displayName: 'Mohamed',
    profilePictureUrl: null,
    isBot: false,
    ...overrides,
  };
}

function renderList(props: Partial<ComponentProps<typeof MessageList>> = {}) {
  return render(
    <MemoryRouter>
      <MessageList
        status="success"
        messages={[]}
        currentUserId="user-ahmed"
        error={null}
        forbidden={false}
        onRetry={vi.fn()}
        feedRef={createRef<HTMLDivElement>()}
        onScroll={vi.fn()}
        canLoadOlder={false}
        isFetchingOlder={false}
        onLoadOlder={vi.fn()}
        realtimeState="connected"
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('Chat message list', () => {
  it('renders the loading skeleton while history is pending', () => {
    renderList({ status: 'pending' });
    expect(screen.getByRole('status', { name: 'Loading messages' })).toBeInTheDocument();
  });

  it('renders the quiet-channel empty state', () => {
    renderList({ messages: [] });
    expect(screen.getByRole('heading', { name: 'A channel with nothing on it yet.' })).toBeInTheDocument();
    expect(screen.getByText('quiet channel')).toBeInTheDocument();
  });

  it('renders the error state and hides retry for forbidden channels', () => {
    const { rerender } = renderList({
      status: 'error',
      error: new ApiError(500, 'Failed', 'The history did not load.'),
    });
    expect(screen.getByRole('heading', { name: 'This channel’s history didn’t load.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <MessageList
          status="error"
          messages={[]}
          currentUserId="user-ahmed"
          error={new ApiError(403, 'Forbidden', 'No access')}
          forbidden
          onRetry={vi.fn()}
          feedRef={createRef<HTMLDivElement>()}
          onScroll={vi.fn()}
          canLoadOlder={false}
          isFetchingOlder={false}
          onLoadOlder={vi.fn()}
          realtimeState="connected"
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'You can’t open this channel.' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Try again/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to inbox/ })).toHaveAttribute('href', '/inbox');
  });

  it('shows optimistic messages as sending and groups consecutive rows', () => {
    const first = message({ id: 'm1', content: 'Did you push the migration?' });
    const second = message({
      id: 'm2',
      content: 'The fix is ready.',
      createdAt: new Date(2026, 4, 29, 10, 2).toISOString(),
    });
    const mine = message({
      id: 'pending-1',
      content: 'On it',
      userId: 'user-ahmed',
      displayName: 'Ahmed',
      createdAt: new Date(2026, 4, 29, 10, 3).toISOString(),
    });

    renderList({ messages: [first, second, mine] });

    expect(screen.getByText('sending')).toBeInTheDocument();
    expect(screen.getByText('On it')).toBeInTheDocument();
    expect(screen.getByText('Did you push the migration?')).toBeInTheDocument();
    expect(document.querySelectorAll('.message--theirs.is-continuation')).toHaveLength(1);
    expect(screen.getByText('start of this channel')).toBeInTheDocument();
  });

  it('offers older-page loading when the history has more', () => {
    const onLoadOlder = vi.fn();
    renderList({ messages: [message()], canLoadOlder: true, onLoadOlder });

    screen.getByRole('button', { name: /Load older messages/ }).click();
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
  });

  it('shows a spinner while older messages are loading', () => {
    renderList({ messages: [message()], canLoadOlder: true, isFetchingOlder: true });
    expect(screen.getByRole('button', { name: /Loading older messages/ })).toBeDisabled();
  });
});
