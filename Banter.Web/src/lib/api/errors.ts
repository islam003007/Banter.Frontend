import { isRecord, record, text } from './parsing';

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly fieldErrors: Record<string, string>;

  constructor(
    status: number,
    title: string,
    detail: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(detail || title || 'The request failed.');
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

const MESSAGE_COPY: Array<[RegExp, string]> = [
  [/Passwords must have at least one non alphanumeric character\.?/i, 'Add a symbol, such as ! or @.'],
  [/Passwords must have at least one uppercase/i, 'Add an uppercase letter.'],
  [/Passwords must have at least one lowercase/i, 'Add a lowercase letter.'],
  [/Passwords must have at least one digit/i, 'Add a number.'],
  [/Passwords must be at least (\d+) characters/i, 'Use at least $1 characters.'],
  [/((email|username).*(already taken|already exists)|duplicate username|a user with this email)/i, 'An account with this email already exists. Sign in instead.'],
  [/(invalid login attempt|invalid credentials|incorrect password)/i, 'That email and password don’t match. Try again.'],
  [/(failed to fetch|networkerror|load failed)/i, 'Banter didn’t answer. Check your connection and try again.'],
  [/response did not include|the desk returned something the app could not read/i, 'We couldn’t read the response. Try again.'],
  [/the request failed/i, 'The request didn’t go through. Try again.'],
];

export function humanizeMessage(message: string): string {
  for (const [pattern, replacement] of MESSAGE_COPY) {
    if (pattern.test(message)) return message.replace(pattern, replacement);
  }
  return message;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return humanizeMessage(error.detail || error.title || 'The request failed.');
  }
  if (error instanceof Error && error.message) return humanizeMessage(error.message);
  return 'Something went wrong. Try again.';
}

export async function readProblem(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const problem = record(body);
  const title = text(problem.title) ?? response.statusText ?? 'Request failed';
  let detail = text(problem.detail) ?? text(problem.message) ?? title;
  const fieldErrors: Record<string, string> = {};

  const errors = problem.errors;
  if (Array.isArray(errors)) {
    const descriptions = errors
      .map((entry) =>
        typeof entry === 'string'
          ? entry
          : text(record(entry).description) ?? text(record(entry).message),
      )
      .filter((entry): entry is string => Boolean(entry));
    if (descriptions.length > 0) detail = descriptions.join(' ');
  } else if (isRecord(errors)) {
    for (const [field, value] of Object.entries(errors)) {
      const message = Array.isArray(value)
        ? value.map(String).join(' ')
        : typeof value === 'string'
          ? value
          : text(record(value).description) ?? '';
      if (message) fieldErrors[field] = message;
    }
    const first = Object.values(fieldErrors)[0];
    if (first && detail === title) detail = first;
  }

  return new ApiError(response.status, title, detail, fieldErrors);
}
