import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useParams } from 'react-router-dom';
import { server } from '../../test/server';
import {
  adaSearchUser,
  mohamedSearchUser,
  saraSearchUser,
} from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { NewConversationPage } from './NewConversationPage';

vi.mock('../auth/AuthProvider', () => ({
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

vi.mock('../../layouts/RailContext', () => ({
  useRail: () => ({ drawerOpen: false, openDrawer: vi.fn(), closeDrawer: vi.fn() }),
}));

function ChatProbe() {
  const { conversationId } = useParams();
  return <div>chat {conversationId}</div>;
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/new" element={<NewConversationPage />} />
      <Route path="/c/:conversationId" element={<ChatProbe />} />
    </Routes>,
    { route: '/new' },
  );
}

function searchHandler(terms: string[]) {
  return http.get('/api/v1/users/search', ({ request }) => {
    terms.push(new URL(request.url).searchParams.get('searchTerm') ?? '');
    return HttpResponse.json({
      users: [saraSearchUser, mohamedSearchUser, adaSearchUser],
      nextCursor: null,
      hasMore: false,
    });
  });
}

describe('New conversation page', () => {
  it('debounces directory searches', async () => {
    const terms: string[] = [];
    server.use(searchHandler(terms));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText('Search by name or email'), 'Sa');
    expect(terms).toEqual([]);

    await waitFor(() => expect(terms).toContain('Sa'), { timeout: 1500 });
    expect(terms).toHaveLength(1);
  });

  it('selects one person in direct mode and replaces the draft on a new pick', async () => {
    server.use(searchHandler([]));
    const user = userEvent.setup();
    renderPage();
    const search = screen.getByPlaceholderText('Search by name or email');

    await user.type(search, 'Sa');
    await screen.findByLabelText('Search results');
    const results = within(screen.getByLabelText('Search results'));
    await user.click(results.getByRole('button', { name: /Sara/ }));

    const builder = screen.getByRole('complementary');
    expect(within(builder).getByText('Open a thread with Sara.')).toBeInTheDocument();
    expect(within(builder).getByRole('button', { name: /Open direct thread/ })).toBeEnabled();

    await user.clear(search);
    await user.type(search, 'Mo');
    await screen.findByLabelText('Search results');
    await user.click(
      within(screen.getByLabelText('Search results')).getByRole('button', { name: /Mohamed/ }),
    );

    expect(within(builder).getByText('Open a thread with Mohamed.')).toBeInTheDocument();
    expect(within(builder).queryByText('Sara')).not.toBeInTheDocument();
  });

  it('keeps AI teammates out of groups and allows a direct bot thread', async () => {
    server.use(searchHandler([]));
    const user = userEvent.setup();
    renderPage();
    const search = screen.getByPlaceholderText('Search by name or email');

    await user.click(screen.getByRole('button', { name: 'Group thread' }));
    await user.type(search, 'Ada');
    await screen.findByLabelText('Search results');
    const groupAda = within(screen.getByLabelText('Search results')).getByRole('button', {
      name: /Ada/,
    });
    expect(groupAda).toBeDisabled();
    expect(screen.getByText(/DM only/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Direct message' }));
    const directAda = within(screen.getByLabelText('Search results')).getByRole('button', {
      name: /Ada/,
    });
    expect(directAda).toBeEnabled();
    await user.click(directAda);

    const builder = screen.getByRole('complementary');
    expect(
      within(builder).getByText('Open a direct thread with Ada, an AI teammate.'),
    ).toBeInTheDocument();
    expect(within(builder).getByRole('button', { name: /Open direct thread/ })).toBeEnabled();
  });

  it('requires two people and a name before creating a group', async () => {
    server.use(searchHandler([]));
    let payload: unknown = null;
    server.use(
      http.post('/api/v1/conversations', async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ id: 'conv-new' });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    const search = screen.getByPlaceholderText('Search by name or email');

    await user.click(screen.getByRole('button', { name: 'Group thread' }));
    await user.type(search, 'Sara');
    await screen.findByLabelText('Search results');
    const results = within(screen.getByLabelText('Search results'));
    await user.click(results.getByRole('button', { name: /Sara/ }));
    await user.click(results.getByRole('button', { name: /Mohamed/ }));

    const builder = screen.getByRole('complementary');
    const create = within(builder).getByRole('button', { name: /Create group thread/ });
    expect(create).toBeDisabled();
    expect(within(builder).getByText('Give the group a name to continue.')).toBeInTheDocument();

    await user.type(within(builder).getByPlaceholderText('Backend Team'), 'Launch Room');
    expect(within(builder).getByText('Create “Launch Room” with 2 people.')).toBeInTheDocument();
    expect(create).toBeEnabled();

    await user.click(create);

    expect(await screen.findByText('chat conv-new')).toBeInTheDocument();
    expect(payload).toEqual({
      participantsIds: [saraSearchUser.id, mohamedSearchUser.id],
      groupTitle: 'Launch Room',
    });
  });

  it('drops bot selections when switching from direct to group mode', async () => {
    server.use(searchHandler([]));
    const user = userEvent.setup();
    renderPage();
    const search = screen.getByPlaceholderText('Search by name or email');

    await user.type(search, 'Ada');
    await screen.findByLabelText('Search results');
    await user.click(
      within(screen.getByLabelText('Search results')).getByRole('button', { name: /Ada/ }),
    );
    expect(screen.getByRole('complementary')).toHaveTextContent('Open a direct thread with Ada');

    await user.click(screen.getByRole('button', { name: 'Group thread' }));
    expect(screen.getByRole('complementary')).toHaveTextContent(
      'Search the directory and pick at least two people.',
    );
    expect(screen.getByRole('complementary')).not.toHaveTextContent('Ada, an AI teammate');
  });
});
