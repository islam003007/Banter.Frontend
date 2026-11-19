import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import { server } from '../test/server';
import { makeInbox, mohamedConversation } from '../test/fixtures';
import { renderWithProviders } from '../test/render';
import { AppRoutes } from './AppRoutes';

vi.mock('../features/auth/AuthProvider', () => ({
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

vi.mock('../lib/realtime/RealtimeProvider', () => ({
  useRealtime: () => ({ state: 'connected', retry: vi.fn(), botTyping: {} }),
  RealtimeProvider: ({ children }: { children: ReactNode }) => children,
}));

describe('application routes', () => {
  it('redirects the root to the channel inbox', async () => {
    server.use(
      http.get('/api/v1/conversations', () =>
        HttpResponse.json(makeInbox([mohamedConversation])),
      ),
    );
    renderWithProviders(<AppRoutes />, { route: '/' });

    expect(await screen.findByRole('heading', { name: 'Ahmed.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Channel index' })).toBeInTheDocument();
  });

  it('renders the session page for /me', async () => {
    server.use(
      http.get('/api/v1/conversations', () => HttpResponse.json(makeInbox([]))),
    );
    renderWithProviders(<AppRoutes />, { route: '/me' });

    expect(await screen.findByRole('heading', { name: 'Ahmed' })).toBeInTheDocument();
    expect(screen.getByText('seated at the night desk')).toBeInTheDocument();
  });

  it('renders the not-found page inside the protected workspace', async () => {
    server.use(
      http.get('/api/v1/conversations', () => HttpResponse.json(makeInbox([]))),
    );
    renderWithProviders(<AppRoutes />, { route: '/no-signal' });

    expect(
      await screen.findByRole('heading', { name: 'This line goes nowhere.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to inbox/ })).toHaveAttribute('href', '/inbox');
  });

  it('sends signed-in users from /login to the inbox', async () => {
    server.use(
      http.get('/api/v1/conversations', () => HttpResponse.json(makeInbox([]))),
    );
    renderWithProviders(<AppRoutes />, { route: '/login' });

    expect(await screen.findByRole('heading', { name: 'Ahmed.' })).toBeInTheDocument();
  });
});
