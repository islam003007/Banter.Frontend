import { describe, expect, it } from 'vitest';
import { firstName, initials, monogramTone, pluralize, truncate } from './text';

describe('text formatting', () => {
  it('derives initials from one or many names', () => {
    expect(initials('Ahmed')).toBe('AH');
    expect(initials('Ahmed Rafat')).toBe('AR');
    expect(initials('  Sara  El  Sayed ')).toBe('SS');
    expect(initials('')).toBe('?');
  });

  it('derives a first name with a fallback', () => {
    expect(firstName('Ahmed Rafat')).toBe('Ahmed');
    expect(firstName('   ')).toBe('there');
    expect(firstName(null)).toBe('there');
  });

  it('pluralizes counts', () => {
    expect(pluralize(1, 'person', 'people')).toBe('1 person');
    expect(pluralize(2, 'person', 'people')).toBe('2 people');
    expect(pluralize(0, 'channel')).toBe('0 channels');
  });

  it('assigns a stable monogram tone and truncates previews', () => {
    expect(monogramTone('Ahmed')).toBe(monogramTone('Ahmed'));
    expect(monogramTone('Ahmed')).toMatch(/^tone-[0-3]$/);
    expect(truncate('short', 10)).toBe('short');
    expect(truncate('a long message', 6)).toBe('a long…');
  });
});
