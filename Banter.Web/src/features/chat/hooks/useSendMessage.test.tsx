import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { server } from '../../../test/server';
import {
  makeInbox,
  makeMessagesPage,
  mohamedConversation,
} from '../../../test/fixtures';
import type { InboxPage } from '../../../lib/api/contracts';
import { createTestQueryClient } from '../../../test/queryClient';
import { queryKeys } from '../../../lib/queryKeys';
import type { MessagePages } from '../../../lib/realtime/cacheUpdates';
import { useSendMessage } from './useSendMessage';

vi.mock('../../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: 'user-ahmed',
      email: 'ahmed@example.com',
      displayName: 'Ahmed',
      profilePictureUrl: null,
    },
    isLoading: false,
    error: null,
    refreshSession: vi.fn(),
    clearSession: vi.fn(),
  }),
}));

function Harness({ onRestoreDraft }: { onRestoreDraft: (content: string) => void }) {
  const { send, isPending, error } = useSendMessage({
    conversationId: 'conv-mohamed',
    onRestoreDraft,
  });
  return (
    <>
      <button type="button" onClick={() => send('hello')}>
        send
      </button>
      <span>{isPending ? 'sending' : 'idle'}</span>
      {error && <p role="alert">{error}</p>}
    </>
  );
}

function setup() {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData<MessagePages>(queryKeys.messages('conv-mohamed'), {
    pages: [makeMessagesPage({ messages: [] })],
    pageParams: [null],
  });
  queryClient.setQueryData(
    queryKeys.inbox,
    makeInbox([{ ...mohamedConversation, lastMessageContent: 'earlier' }]),
  );
  const onRestoreDraft = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <Harness onRestoreDraft={onRestoreDraft} />
    </QueryClientProvider>,
  );
  return { queryClient, onRestoreDraft };
}

function cachedMessageIds(queryClient: ReturnType<typeof createTestQueryClient>) {
  return (
    queryClient
      .getQueryData<MessagePages>(queryKeys.messages('conv-mohamed'))
      ?.pages.flatMap((page) => page.messages.map((message) => message.id)) ?? []
  );
}

function cachedInbox(queryClient: ReturnType<typeof createTestQueryClient>) {
  return queryClient.getQueryData<InboxPage>(queryKeys.inbox);
}

describe('useSendMessage', () => {
  it('adds an optimistic message and swaps in the server id', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/v1/conversations/conv-mohamed/messages', async () => {
        await delay(30);
        return HttpResponse.json({ id: 'server-message' });
      }),
    );
    const { queryClient } = setup();

    await user.click(screen.getByRole('button', { name: 'send' }));

    await waitFor(() => expect(cachedMessageIds(queryClient)[0]).toMatch(/^pending-/));
    expect(cachedInbox(queryClient)?.conversations[0].lastMessageContent).toBe('hello');

    await waitFor(() => expect(cachedMessageIds(queryClient)).toContain('server-message'));
    expect(cachedMessageIds(queryClient)).toHaveLength(1);
  });

  it('rolls back the optimistic row and restores the draft on failure', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/v1/conversations/conv-mohamed/messages', () =>
        HttpResponse.json({ title: 'Server unavailable', detail: 'Try later.' }, { status: 500 }),
      ),
    );
    const { queryClient, onRestoreDraft } = setup();

    await user.click(screen.getByRole('button', { name: 'send' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Try later.');
    expect(onRestoreDraft).toHaveBeenCalledWith('hello');
    await waitFor(() => expect(cachedMessageIds(queryClient)).toEqual([]));
    expect(cachedInbox(queryClient)?.conversations[0].lastMessageContent).toBe('earlier');
  });

  it('keeps one request in flight while pending', async () => {
    const user = userEvent.setup();
    let requests = 0;
    server.use(
      http.post('/api/v1/conversations/conv-mohamed/messages', async () => {
        requests += 1;
        await delay(40);
        return HttpResponse.json({ id: 'server-message' });
      }),
    );
    const { queryClient } = setup();
    const send = screen.getByRole('button', { name: 'send' });

    await user.click(send);
    expect(screen.getByText('sending')).toBeInTheDocument();
    await user.click(send);

    await waitFor(() => expect(cachedMessageIds(queryClient)).toContain('server-message'));
    expect(requests).toBe(1);
  });
});
