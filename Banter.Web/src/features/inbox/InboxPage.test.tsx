import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { http, HttpResponse, delay } from 'msw';
import { screen, within } from '@testing-library/react';
import { server } from '../../test/server';
import { designGroup, makeInbox, mohamedConversation } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { InboxPage } from './InboxPage';

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

vi.mock('../../lib/realtime/RealtimeProvider', () => ({
  useRealtime: () => ({ state: 'connected', retry: vi.fn(), botTyping: {} }),
  RealtimeProvider: ({ children }: { children: ReactNode }) => children,
}));

const conversations = [
  { ...mohamedConversation, isOnline: true, unreadCount: 2 },
  designGroup,
];

describe('Inbox page', () => {
  it('shows loading skeletons while the desk opens', async () => {
    server.use(
      http.get('/api/v1/conversations', async () => {
        await delay(80);
        return HttpResponse.json(makeInbox(conversations));
      }),
    );
    renderWithProviders(<InboxPage />, { route: '/inbox' });

    expect(screen.getByRole('status', { name: 'Loading recent channels' })).toBeInTheDocument();
    expect(await screen.findByText('Mohamed')).toBeInTheDocument();
  });

  it('sorts recent transmissions and surfaces unread and group badges', async () => {
    server.use(
      http.get('/api/v1/conversations', () => HttpResponse.json(makeInbox(conversations))),
    );
    renderWithProviders(<InboxPage />, { route: '/inbox' });

    const mohamed = await screen.findByRole('link', {
      name: /channel 01, Mohamed, online now, 2 unread/,
    });
    const group = screen.getByRole('link', {
      name: /channel 02, Design Crit, group channel, 1 unread/,
    });

    expect(mohamed.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByText('group channel')).toBeInTheDocument();
    expect(screen.queryByText('AI desk / 03 operators')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /AI operator/ })).not.toBeInTheDocument();

    const ledgerStage = screen.getByRole('heading', { name: 'Ahmed.' }).closest('.welcome__stage');
    expect(ledgerStage).not.toBeNull();
    expect(screen.getAllByText('02').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('03').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the empty desk with a way to find someone', async () => {
    server.use(
      http.get('/api/v1/conversations', () => HttpResponse.json(makeInbox([]))),
    );
    renderWithProviders(<InboxPage />, { route: '/inbox' });

    expect(await screen.findByRole('heading', { name: 'No channels on the desk yet.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find someone' })).toHaveAttribute('href', '/new');
    expect(screen.getAllByText('00').length).toBeGreaterThanOrEqual(1);
  });

  it('shows a recoverable error when the desk fails', async () => {
    server.use(
      http.get('/api/v1/conversations', () =>
        HttpResponse.json(
          { title: 'Server unavailable', detail: 'The database is offline.' },
          { status: 503 },
        ),
      ),
    );
    renderWithProviders(<InboxPage />, { route: '/inbox' });

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('the desk didn’t load')).toBeInTheDocument();
    expect(within(alert).getByText('The database is offline.')).toBeInTheDocument();
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
