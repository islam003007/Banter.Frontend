import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dayKey,
  formatClock,
  formatDayLabel,
  formatLongDate,
  formatThreadTime,
  isWithinMinutes,
  parseDate,
} from './date';

const NOW = new Date(2026, 4, 29, 12, 0, 0);

describe('date formatting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses valid dates and rejects invalid values', () => {
    expect(parseDate('2026-05-29T10:00:00.000Z')).toBeInstanceOf(Date);
    expect(parseDate('not a date')).toBeNull();
    expect(parseDate(null)).toBeNull();
  });

  it('formats clocks, day labels, and long dates', () => {
    const today = new Date(2026, 4, 29, 9, 5).toISOString();
    const yesterday = new Date(2026, 4, 28, 18, 30).toISOString();
    const older = new Date(2026, 3, 2, 14, 5).toISOString();

    expect(formatClock(today)).toBe('09:05');
    expect(formatDayLabel(today)).toBe('Today');
    expect(formatDayLabel(yesterday)).toBe('Yesterday');
    expect(formatDayLabel(older)).toBe('Thursday, 2 April');
    expect(formatLongDate(older)).toBe('2 April 2026, 14:05');
  });

  it('formats relative thread times across the ranges', () => {
    expect(formatThreadTime(new Date(NOW.getTime() - 10_000).toISOString())).toBe('now');
    expect(formatThreadTime(new Date(NOW.getTime() - 10 * 60_000).toISOString())).toBe('10m');
    expect(formatThreadTime(new Date(2026, 4, 29, 8, 0).toISOString())).toBe('08:00');
    expect(formatThreadTime(new Date(2026, 4, 28, 18, 0).toISOString())).toBe('Yesterday');
    expect(formatThreadTime(new Date(2026, 4, 26, 18, 0).toISOString())).toBe('Tue');
    expect(formatThreadTime(new Date(2026, 3, 2, 18, 0).toISOString())).toBe('2 Apr');
  });

  it('uses stable day keys independent of the time of day', () => {
    const morning = new Date(2026, 4, 29, 1, 0).toISOString();
    const evening = new Date(2026, 4, 29, 23, 0).toISOString();
    const tomorrow = new Date(2026, 4, 30, 12, 0).toISOString();
    expect(dayKey(morning)).toBe(dayKey(evening));
    expect(dayKey(morning)).not.toBe(dayKey(tomorrow));
  });

  it('detects times within a minute window', () => {
    const base = '2026-05-29T12:00:00.000Z';
    expect(isWithinMinutes(base, '2026-05-29T12:04:00.000Z', 5)).toBe(true);
    expect(isWithinMinutes(base, '2026-05-29T12:06:00.000Z', 5)).toBe(false);
    expect(isWithinMinutes(null, base, 5)).toBe(false);
  });
});
