import { describe, expect, it, vi } from 'vitest';import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { ApiError, errorMessage, isUnauthorized, readProblem } from './errors';
import { request } from './transport';

describe('API transport', () => {
  it('parses a successful JSON response', async () => {
    server.use(http.get('/api/v1/ping', () => HttpResponse.json({ ok: true })));
    await expect(request<{ ok: boolean }>('/ping')).resolves.toEqual({ ok: true });
  });

  it('sends an Accept header and credentials', async () => {
    let seenCredentials: RequestCredentials | null = null;
    const originalFetch = globalThis.fetch;
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      seenCredentials = init?.credentials ?? null;
      return originalFetch(input, init);
    });
    server.use(
      http.get('/api/v1/ping', ({ request: incoming }) => {
        expect(incoming.headers.get('Accept')).toBe('application/json');
        return HttpResponse.json({ ok: true });
      }),
    );
    await request('/ping');
    expect(seenCredentials).toBe('include');
    spy.mockRestore();
  });

  it('returns undefined for 204 and empty bodies', async () => {
    server.use(
      http.delete('/api/v1/empty', () => new HttpResponse(null, { status: 204 })),
      http.get('/api/v1/blank', () => new HttpResponse('', { status: 200 })),
    );
    await expect(request('/empty', { method: 'DELETE' })).resolves.toBeUndefined();
    await expect(request('/blank')).resolves.toBeUndefined();
  });

  it('maps ProblemDetails failures to ApiError with field errors', async () => {
    server.use(
      http.get('/api/v1/fail', () =>
        HttpResponse.json(
          {
            title: 'Validation failed',
            detail: 'One or more errors occurred.',
            errors: { Email: ['Already used'], Password: 'Too short' },
          },
          { status: 400 },
        ),
      ),
    );

    const error = await request('/fail').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.status).toBe(400);
    expect(apiError.title).toBe('Validation failed');
    expect(apiError.detail).toBe('One or more errors occurred.');
    expect(apiError.fieldErrors).toEqual({
      Email: 'Already used',
      Password: 'Too short',
    });
    expect(apiError.message).toBe('One or more errors occurred.');
  });

  it('uses the first field error when no detail is supplied', async () => {
    server.use(
      http.get('/api/v1/fail', () =>
        HttpResponse.json(
          { title: 'Validation failed', errors: { Email: ['Already used'] } },
          { status: 422 },
        ),
      ),
    );

    const error = (await request('/fail').catch((caught: unknown) => caught)) as ApiError;
    expect(error.detail).toBe('Already used');
    expect(error.fieldErrors).toEqual({ Email: 'Already used' });
  });

  it('joins array validation errors into the detail', async () => {
    server.use(
      http.get('/api/v1/fail', () =>
        HttpResponse.json(
          {
            title: 'Validation failed',
            errors: [{ description: 'First problem' }, { message: 'Second problem' }],
          },
          { status: 400 },
        ),
      ),
    );

    const error = (await request('/fail').catch((caught: unknown) => caught)) as ApiError;
    expect(error.detail).toBe('First problem Second problem');
  });

  it('flags 401 responses as unauthorized', async () => {
    server.use(
      http.get('/api/v1/private', () =>
        HttpResponse.json({ title: 'Unauthorized' }, { status: 401 }),
      ),
    );

    const error = await request('/private').catch((caught: unknown) => caught);
    expect(isUnauthorized(error)).toBe(true);
    expect(errorMessage(error)).toBe('Unauthorized');
  });

  it('reports network failures with status 0', async () => {
    server.use(http.get('/api/v1/offline', () => HttpResponse.error()));
    const error = (await request('/offline').catch((caught: unknown) => caught)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.title).toBe('Network unavailable');
  });

  it('rejects unreadable response bodies', async () => {
    server.use(
      http.get('/api/v1/broken', () =>
        new HttpResponse('not json', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        }),
      ),
    );
    const error = (await request('/broken').catch((caught: unknown) => caught)) as ApiError;
    expect(error.status).toBe(200);
    expect(error.title).toBe('Unexpected response');
  });

  it('reads a non-JSON problem response without throwing', async () => {
    const response = new Response('gateway down', { status: 502, statusText: 'Bad Gateway' });
    const error = await readProblem(response);
    expect(error.status).toBe(502);
    expect(error.detail).toBe('Bad Gateway');
  });
});
