import { differenceInMinutes, differenceInSeconds, format, isToday, isYesterday } from 'date-fns';

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dayKey(value: string | null | undefined): string {
  const date = parseDate(value) ?? new Date();
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
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

export function isWithinMinutes(
  left: string | null | undefined,
  right: string | null | undefined,
  minutes: number,
): boolean {
  const leftDate = parseDate(left);
  const rightDate = parseDate(right);
  if (!leftDate || !rightDate) return false;
  return Math.abs(differenceInMinutes(leftDate, rightDate)) < minutes;
}
