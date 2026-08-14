import { describe, expect, it } from 'vitest';

import {
  compactAvailabilityTimeRange,
  formatOutreachAvailabilityDays,
  getOutreachAvailabilityDisplay,
  parseOutreachAvailabilitySummary,
} from '@/lib/outreachAvailabilityDisplay';

describe('outreachAvailabilityDisplay', () => {
  it('compacts 12-hour ranges and detects all-day', () => {
    expect(compactAvailabilityTimeRange('09:00 AM-05:00 PM')).toBe('9 AM – 5 PM');
    expect(compactAvailabilityTimeRange('08:30 AM-12:00 PM')).toBe('8:30 AM – 12 PM');
    expect(compactAvailabilityTimeRange('12:00 AM-11:59 PM')).toBe('All day');
  });

  it('parses SQL availability summaries', () => {
    expect(
      parseOutreachAvailabilitySummary(
        'Mon 09:00 AM-05:00 PM, Tue 09:00 AM-05:00 PM, Wed 09:00 AM-05:00 PM',
      ),
    ).toEqual([
      { day: 'Mon', dayIndex: 1, timeLabel: '9 AM – 5 PM' },
      { day: 'Tue', dayIndex: 2, timeLabel: '9 AM – 5 PM' },
      { day: 'Wed', dayIndex: 3, timeLabel: '9 AM – 5 PM' },
    ]);
  });

  it('collapses consecutive days', () => {
    const slots = parseOutreachAvailabilitySummary(
      'Mon 09:00 AM-05:00 PM, Tue 09:00 AM-05:00 PM, Wed 09:00 AM-05:00 PM, Thu 09:00 AM-05:00 PM',
    );
    expect(formatOutreachAvailabilityDays(slots)).toBe('Mon–Thu');
  });

  it('keeps gaps as a comma list', () => {
    const slots = parseOutreachAvailabilitySummary(
      'Mon 09:00 AM-05:00 PM, Wed 09:00 AM-05:00 PM, Fri 09:00 AM-05:00 PM',
    );
    expect(formatOutreachAvailabilityDays(slots)).toBe('Mon, Wed, Fri');
  });

  it('builds a two-line card display', () => {
    expect(
      getOutreachAvailabilityDisplay(
        'Mon 09:00 AM-05:00 PM, Tue 09:00 AM-05:00 PM, Wed 09:00 AM-05:00 PM, Thu 09:00 AM-05:00 PM',
      ),
    ).toEqual({
      daysLabel: 'Mon–Thu',
      hoursLabel: '9 AM – 5 PM',
      accessibilityLabel: 'Available Mon–Thu, 9 AM – 5 PM',
    });

    expect(
      getOutreachAvailabilityDisplay('Fri 08:00 AM-05:00 PM'),
    ).toEqual({
      daysLabel: 'Fri',
      hoursLabel: '8 AM – 5 PM',
      accessibilityLabel: 'Available Fri, 8 AM – 5 PM',
    });

    expect(
      getOutreachAvailabilityDisplay('Mon 09:00 AM-05:00 PM, Fri 08:00 AM-12:00 PM'),
    ).toEqual({
      daysLabel: 'Mon, Fri',
      hoursLabel: 'Varied hours',
      accessibilityLabel: 'Available Mon, Fri, varied hours',
    });
  });
});
