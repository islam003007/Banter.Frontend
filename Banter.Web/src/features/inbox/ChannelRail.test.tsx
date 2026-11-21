import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { http, HttpResponse, delay } from 'msw';
import { screen, within } from '@testing-library/react';
import { server } from '../../test/server';
import {
  adaConversation,
  designGroup,
  makeInbox,
  mohamedConversation,
} from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { ChannelRail } from './ChannelRail';

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

describe('Channel rail', () => {
  it('lists channels with unread and active state', async () => {
    server.use(
      http.get('/api/v1/conversations', () =>
        HttpResponse.json(
          makeInbox([
            { ...mohamedConversation, unreadCount: 2, isOnline: true },
            adaConversation,
            designGroup,
          ]),
        ),
      ),
    );

    renderWithProviders(<ChannelRail />, { route: '/c/conv-mohamed' });

    const nav = await screen.findByRole('navigation', { name: 'Channels' });
    expect(within(nav).getAllByRole('link')).toHaveLength(3);
    expect(screen.getByRole('link', { name: /Mohamed/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /Ada, AI operator/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Design Crit, group channel/ })).toBeInTheDocument();
    expect(screen.getByText('3 unread')).toBeInTheDocument();
    expect(screen.getByText('group')).toBeInTheDocument();
  });

  it('shows loading rows while the inbox query is pending', async () => {
    server.use(
      http.get('/api/v1/conversations', async () => {
        await delay(80);
        return HttpResponse.json(makeInbox([]));
      }),
    );
    renderWithProviders(<ChannelRail />, { route: '/inbox' });

    expect(screen.getByRole('status', { name: 'Loading channels' })).toBeInTheDocument();
    expect(await screen.findByText('Start a channel.')).toBeInTheDocument();
  });

  it('shows the empty state and an error state with retry', async () => {
    server.use(
      http.get('/api/v1/conversations', () => HttpResponse.json(makeInbox([]))),
    );
    const { unmount } = renderWithProviders(<ChannelRail />, { route: '/inbox' });
    expect(await screen.findByText('Start a channel.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find someone' })).toHaveAttribute('href', '/new');
    unmount();

    server.use(
      http.get('/api/v1/conversations', () =>
        HttpResponse.json({ title: 'Offline', detail: 'No signal.' }, { status: 503 }),
      ),
    );
    renderWithProviders(<ChannelRail />, { route: '/inbox' });
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('the desk didn’t load')).toBeInTheDocument();
    expect(within(alert).getByText('No signal.')).toBeInTheDocument();
  });
});
