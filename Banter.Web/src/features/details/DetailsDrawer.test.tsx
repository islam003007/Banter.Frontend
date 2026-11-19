import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { server } from '../../test/server';
import { makeDetail } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { DetailsDrawer } from './DetailsDrawer';

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

const groupDetail = makeDetail({
  conversationId: 'conv-design',
  title: 'Design Crit',
  displayName: 'Design Crit',
  isGroup: true,
  participants: [
    { userId: 'user-ahmed', displayName: 'Ahmed', profilePictureUrl: null, isOnline: true },
    { userId: 'user-mohamed', displayName: 'Mohamed', profilePictureUrl: null, isOnline: false },
    {
      userId: 'bot-ada',
      displayName: 'Ada',
      profilePictureUrl: null,
      isOnline: false,
      isBot: true,
    },
  ],
});

function renderDrawer({
  open = true,
  onClose = vi.fn(),
  detail = groupDetail,
}: {
  open?: boolean;
  onClose?: () => void;
  detail?: typeof groupDetail;
} = {}) {
  server.use(
    http.get('/api/v1/conversations/conv-design', () => HttpResponse.json(detail)),
  );
  return renderWithProviders(
    <Routes>
      <Route
        path="/c/:conversationId"
        element={
          <DetailsDrawer
            conversationId="conv-design"
            fallbackName="Design Crit"
            fallbackIsGroup={detail.isGroup}
            open={open}
            onClose={onClose}
          />
        }
      />
      <Route path="/inbox" element={<div>Inbox route</div>} />
    </Routes>,
    { route: '/c/conv-design' },
  );
}

describe('Details drawer', () => {
  it('loads participants, focuses the close control, and closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDrawer({ onClose });

    const dialog = await screen.findByRole('dialog', { name: 'Design Crit' });
    const close = within(dialog).getByRole('button', { name: 'Close details' });
    await waitFor(() => expect(close).toHaveFocus());

    expect(await within(dialog).findByText('Mohamed')).toBeInTheDocument();
    expect(within(dialog).getByText('Ahmed')).toBeInTheDocument();
    expect(within(dialog).getByText('you')).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: 'AI teammate' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab focus inside the dialog', async () => {
    const user = userEvent.setup();
    renderDrawer();

    const dialog = await screen.findByRole('dialog', { name: 'Design Crit' });
    const buttons = within(dialog).getAllByRole('button');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    await waitFor(() => expect(first).toHaveFocus());

    last.focus();
    await user.tab();
    expect(first).toHaveFocus();

    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it('confirms and performs the leave action for groups', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    let deleted = false;
    server.use(
      http.delete('/api/v1/conversations/conv-design/participants/me', () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDrawer({ onClose });

    const dialog = await screen.findByRole('dialog', { name: 'Design Crit' });
    await user.click(within(dialog).getByRole('button', { name: /Leave conversation/ }));
    expect(
      within(dialog).getByText(/Leave “Design Crit”\? The channel disappears from your inbox/),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Yes, leave' }));

    expect(await screen.findByText('Inbox route')).toBeInTheDocument();
    expect(deleted).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  it('hides leave controls for direct channels', async () => {
    const direct = makeDetail({
      conversationId: 'conv-design',
      displayName: 'Mohamed',
      isGroup: false,
      participants: [
        { userId: 'user-ahmed', displayName: 'Ahmed', profilePictureUrl: null, isOnline: true },
        {
          userId: 'user-mohamed',
          displayName: 'Mohamed',
          profilePictureUrl: null,
          isOnline: false,
        },
      ],
    });
    renderDrawer({ detail: direct });

    const dialog = await screen.findByRole('dialog', { name: 'Mohamed' });
    expect(
      within(dialog).getByText(/Leave is only available for group channels/),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('button', { name: /Leave conversation/ }),
    ).not.toBeInTheDocument();
  });
});
