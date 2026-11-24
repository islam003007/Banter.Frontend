import { ApiError, readProblem } from './errors';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? '';

export const API_PREFIX = `${apiBaseUrl}/api/v1`;

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      'Network unavailable',
      'Banter didn’t answer. Check your connection and try again.',
    );
  }

  if (response.status === 401) {
    throw await readProblem(response);
  }

  if (!response.ok) {
    throw await readProblem(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  if (!raw) return undefined as T;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiError(
      response.status,
      'Unexpected response',
      'We couldn’t read the response. Try again.',
    );
  }
}
