export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function record(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

export function text(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function number(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

export function boolean(value: unknown): boolean {
  return value === true;
}

export function optionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === 'true') return true;
  if (value === 0 || value === 'false') return false;
  return undefined;
}

export function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function stringList(value: unknown): string[] {
  return list(value).filter((item): item is string => typeof item === 'string');
}
