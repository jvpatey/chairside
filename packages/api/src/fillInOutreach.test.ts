import { describe, expect, it } from 'vitest';

import { isUrgentOutreachShift } from './fillInOutreachUtils';

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('isUrgentOutreachShift', () => {
  it('returns true for today', () => {
    const today = toLocalDateString(new Date());
    expect(isUrgentOutreachShift(today)).toBe(true);
  });

  it('returns true for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = toLocalDateString(tomorrow);
    expect(isUrgentOutreachShift(iso)).toBe(true);
  });

  it('returns false for shifts two or more days out', () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);
    const iso = toLocalDateString(future);
    expect(isUrgentOutreachShift(iso)).toBe(false);
  });
});
