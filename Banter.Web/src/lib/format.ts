import {
  differenceInMinutes,
  differenceInSeconds,
  format,
  isToday,
  isYesterday,
} from 'date-fns';

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatClock(value: string | null | undefined): string {
  const date = parseDate(value);
  return date ? format(date, 'HH:mm') : '';
}

export function formatDayLabel(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, d MMMM');
}

export function formatThreadTime(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '';
  const now = new Date();
  const seconds = differenceInSeconds(now, date);
  if (seconds < 45) return 'now';
  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) return `${minutes}m`;
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return format(date, 'EEE');
  }
  return format(date, 'd MMM');
}

export function formatLongDate(value: string | null | undefined): string {
  const date = parseDate(value);
  return date ? format(date, 'd MMMM yyyy, HH:mm') : '';
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function firstName(name: string | null | undefined): string {
  return name?.trim().split(/\s+/)[0] || 'there';
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function monogramTone(name: string | null | undefined): string {
  const value = name ?? '';
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 997;
  }
  return `tone-${hash % 4}`;
}
