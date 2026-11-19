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

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.detail || error.title || 'The request failed.';
  }
  if (error instanceof Error && error.message) return error.message;
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
