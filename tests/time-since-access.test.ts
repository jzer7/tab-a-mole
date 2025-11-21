// popup-utils.test.js
import { describe, it, expect } from 'bun:test';
import { timeSinceAccessText } from '../scripts/time-since-access.ts';

describe('timeSinceAccessText', () => {
  const now = 1_000_000_000_000; // fixed timestamp for deterministic tests

  it('returns seconds ago for < 1 min', () => {
    expect(timeSinceAccessText(now - 10_000, now)).toBe('10 seconds ago');
  });

  it('returns minutes ago for < 1 hour', () => {
    expect(timeSinceAccessText(now - 120_000, now)).toBe('2 minutes ago');
  });

  it('returns hours ago for < 1 day', () => {
    expect(timeSinceAccessText(now - 7_200_000, now)).toBe('2 hours ago');
  });

  it('returns days ago for >= 1 day', () => {
    expect(timeSinceAccessText(now - 172_800_000, now)).toBe('2 days ago');
  });
});
