import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';

const auth = vi.hoisted(() => ({
  value: {
    user: null as { id: string; displayName: string; email: string; profilePictureUrl: null } | null,
    isLoading: false,
    error: null as Error | null,
    refreshSession: vi.fn(async () => null),
    clearSession: vi.fn(),
  },
}));

vi.mock('./AuthProvider', () => ({
  useAuth: () => auth.value,
}));

vi.mock('../../lib/realtime/RealtimeProvider', () => ({
  RealtimeProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="realtime">{children}</div>
  ),
  useRealtime: () => ({ state: 'connected', retry: vi.fn(), botTyping: {} }),
}));

function LocationProbe() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '';
  return <div>{`path:${location.pathname}|from:${from}`}</div>;
}

function protectedRoutes() {
  return (
    <MemoryRouter initialEntries={['/c/conv-1']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/c/:conversationId" element={<div>Protected chat</div>} />
        </Route>
        <Route path="/login" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

function publicRoutes() {
  return (
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <div>Login form</div>
            </PublicOnlyRoute>
          }
        />
        <Route path="/inbox" element={<LocationProbe />} />
        <Route path="/c/:conversationId" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('auth guards', () => {
  beforeEach(() => {
    auth.value = {
      user: null,
      isLoading: false,
      error: null,
      refreshSession: vi.fn(async () => null),
      clearSession: vi.fn(),
    };
  });

  it('shows the splash screen while the session is loading', () => {
    auth.value = { ...auth.value, isLoading: true };
    render(protectedRoutes());
    expect(screen.getByRole('status', { name: 'Checking your session' })).toBeInTheDocument();
  });

  it('shows a session problem with retry when the session request fails', async () => {
    const user = userEvent.setup();
    const refreshSession = vi.fn(async () => null);
    auth.value = {
      ...auth.value,
      error: new Error('The desk did not answer.'),
      refreshSession,
    };
    render(protectedRoutes());

    expect(screen.getByText('the desk did not answer')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Try again/ }));
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it('redirects unauthenticated visitors to login and remembers the destination', () => {
    render(protectedRoutes());
    expect(screen.getByText('path:/login|from:/c/conv-1')).toBeInTheDocument();
  });

  it('renders protected routes inside the realtime provider', () => {
    auth.value = {
      ...auth.value,
      user: {
        id: 'user-ahmed',
        displayName: 'Ahmed',
        email: 'ahmed@example.com',
        profilePictureUrl: null,
      },
    };
    render(protectedRoutes());
    expect(screen.getByTestId('realtime')).toContainElement(screen.getByText('Protected chat'));
  });

  it('keeps signed-in users out of the login route', () => {
    auth.value = {
      ...auth.value,
      user: {
        id: 'user-ahmed',
        displayName: 'Ahmed',
        email: 'ahmed@example.com',
        profilePictureUrl: null,
      },
    };
    render(publicRoutes());
    expect(screen.getByText('path:/inbox|from:')).toBeInTheDocument();
    expect(screen.queryByText('Login form')).not.toBeInTheDocument();
  });

  it('returns signed-in users to the location they were denied', () => {
    auth.value = {
      ...auth.value,
      user: {
        id: 'user-ahmed',
        displayName: 'Ahmed',
        email: 'ahmed@example.com',
        profilePictureUrl: null,
      },
    };
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/c/conv-1' } }]}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <div>Login form</div>
              </PublicOnlyRoute>
            }
          />
          <Route path="/c/:conversationId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('path:/c/conv-1|from:')).toBeInTheDocument();
  });

  it('renders the public page for anonymous visitors', () => {
    render(publicRoutes());
    expect(screen.getByText('Login form')).toBeInTheDocument();
  });
});
