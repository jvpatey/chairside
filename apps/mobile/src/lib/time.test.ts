import { describe, expect, it } from 'vitest';

import { formatTimeRangePreview } from './time';

describe('formatTimeRangePreview', () => {
  it('formats a valid daytime range', () => {
    expect(formatTimeRangePreview('08:00', '17:00')).toBe('8 AM – 5 PM');
  });

  it('returns null for missing times', () => {
    expect(formatTimeRangePreview(null, '17:00')).toBeNull();
    expect(formatTimeRangePreview('08:00', undefined)).toBeNull();
    expect(formatTimeRangePreview('', '')).toBeNull();
  });

  it('returns null for equal midnight range instead of 12 AM – 12 AM', () => {
    expect(formatTimeRangePreview('00:00', '00:00')).toBeNull();
    expect(formatTimeRangePreview('0:00', '0:00')).toBeNull();
  });

  it('returns null for inverted ranges', () => {
    expect(formatTimeRangePreview('17:00', '08:00')).toBeNull();
  });
});
