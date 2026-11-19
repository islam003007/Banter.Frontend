import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { currentUser, demoUsers, mohamedConversation } from '../../test/fixtures';
import { api } from './index';

describe('API client', () => {
  it('returns null for an unauthenticated session', async () => {
    server.use(
      http.get('/api/v1/auth/me', () =>
        HttpResponse.json({ title: 'Unauthorized' }, { status: 401 }),
      ),
    );
    await expect(api.getSession()).resolves.toBeNull();
  });

  it('normalizes the current session', async () => {
    server.use(http.get('/api/v1/auth/me', () => HttpResponse.json({ user: currentUser })));
    await expect(api.getSession()).resolves.toEqual(currentUser);
  });

  it('loads demo users from a bare array or a wrapper', async () => {
    server.use(
      http.get('/api/v1/auth/demo-users', () => HttpResponse.json(demoUsers.slice(0, 1))),
    );
    await expect(api.getDemoUsers()).resolves.toHaveLength(1);

    server.use(
      http.get('/api/v1/auth/demo-users', () => HttpResponse.json({ users: demoUsers })),
    );
    await expect(api.getDemoUsers()).resolves.toHaveLength(demoUsers.length);
  });

  it('requests the inbox with the page size', async () => {
    server.use(
      http.get('/api/v1/conversations', ({ request }) => {
        expect(new URL(request.url).searchParams.get('pageSize')).toBe('50');
        return HttpResponse.json({ conversations: [mohamedConversation] });
      }),
    );
    const inbox = await api.getInbox(50);
    expect(inbox.conversations[0].conversationId).toBe('conv-mohamed');
  });

  it('loads a cursor page of messages', async () => {
    server.use(
      http.get('/api/v1/conversations/conv-1/messages', ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get('pageSize')).toBe('30');
        expect(params.get('cursor')).toBe('cursor-9');
        return HttpResponse.json({
          messages: [{ id: 'm1', content: 'hi' }],
          nextCursor: 'cursor-8',
          hasMore: true,
          lastSeenMessageId: 'm1',
        });
      }),
    );

    const page = await api.getMessages('conv-1', 'cursor-9', 30);
    expect(page.messages[0].id).toBe('m1');
    expect(page.nextCursor).toBe('cursor-8');
    expect(page.hasMore).toBe(true);
  });

  it('sends a message and normalizes the returned id', async () => {
    server.use(
      http.post('/api/v1/conversations/conv-1/messages', async ({ request }) => {
        await expect(request.json()).resolves.toEqual({ content: 'hello' });
        return HttpResponse.json({ messageId: 'server-message' });
      }),
    );
    await expect(api.sendMessage('conv-1', 'hello')).resolves.toBe('server-message');
  });

  it('creates a conversation with the API spelling of the participant ids', async () => {
    server.use(
      http.post('/api/v1/conversations', async ({ request }) => {
        await expect(request.json()).resolves.toEqual({
          participantsIds: ['u1', 'u2'],
          groupTitle: 'Launch Room',
        });
        return HttpResponse.json({ id: 'conv-new' });
      }),
    );

    await expect(api.createConversation(['u1', 'u2'], 'Launch Room')).resolves.toBe('conv-new');
  });

  it('searches users with cursor and term parameters', async () => {
    server.use(
      http.get('/api/v1/users/search', ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get('searchTerm')).toBe('ada lovelace');
        expect(params.get('pageSize')).toBe('20');
        expect(params.get('cursor')).toBe('next-1');
        return HttpResponse.json({
          users: [{ id: 'b1', displayName: 'Ada', isBot: true }],
          nextCursor: null,
          hasMore: false,
        });
      }),
    );

    const page = await api.searchUsers('ada lovelace', 'next-1');
    expect(page.users[0].displayName).toBe('Ada');
    expect(page.users[0].isBot).toBe(true);
  });

  it('marks a conversation read and leaves with the expected verbs', async () => {
    let marked = false;
    let left = false;
    server.use(
      http.post('/api/v1/conversations/conv-1/mark-as-read', () => {
        marked = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete('/api/v1/conversations/conv-1/participants/me', () => {
        left = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await api.markAsRead('conv-1');
    await api.leaveConversation('conv-1');
    expect(marked).toBe(true);
    expect(left).toBe(true);
  });

  it('surfaces validation field errors from failed registrations', async () => {
    server.use(
      http.post('/api/v1/users/register', () =>
        HttpResponse.json(
          {
            title: 'Validation failed',
            errors: { Email: ['Already registered'] },
          },
          { status: 400 },
        ),
      ),
    );

    const error = await api
      .register({
        email: 'ahmed@example.com',
        displayName: 'Ahmed',
        password: 'Password1',
        passwordConfirm: 'Password1',
      })
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      status: 400,
      fieldErrors: { Email: 'Already registered' },
    });
  });
});
