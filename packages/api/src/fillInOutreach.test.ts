import { describe, expect, it } from 'vitest';

import { isUrgentOutreachShift } from './fillInOutreachUtils';

describe('isUrgentOutreachShift', () => {
  it('returns true for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(isUrgentOutreachShift(today)).toBe(true);
  });

  it('returns true for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = tomorrow.toISOString().slice(0, 10);
    expect(isUrgentOutreachShift(iso)).toBe(true);
  });

  it('returns false for shifts two or more days out', () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);
    const iso = future.toISOString().slice(0, 10);
    expect(isUrgentOutreachShift(iso)).toBe(false);
  });
});
