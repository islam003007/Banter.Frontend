import { describe, expect, it } from 'vitest';
import { nextRetryDelay } from './hub';

describe('realtime reconnect policy', () => {
  it('backs off and gives up after six attempts', () => {
    expect(nextRetryDelay(0)).toBe(0);
    expect(nextRetryDelay(1)).toBe(1000);
    expect(nextRetryDelay(5)).toBe(20_000);
    expect(nextRetryDelay(6)).toBeNull();
  });
});
