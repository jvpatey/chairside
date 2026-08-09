import { describe, expect, it } from 'vitest';

import {
  ALL_DAY_END_TIME,
  ALL_DAY_START_TIME,
  blocksToDayAvailability,
  dayAvailabilityToBlocks,
  formatAvailabilityTimeRange,
  isAllDayAvailability,
} from '@/lib/availabilitySchedule';

describe('availabilitySchedule', () => {
  it('detects all-day sentinel times', () => {
    expect(isAllDayAvailability(ALL_DAY_START_TIME, ALL_DAY_END_TIME)).toBe(true);
    expect(isAllDayAvailability('00:00:00', '23:59:00')).toBe(true);
    expect(isAllDayAvailability('09:00', '17:00')).toBe(false);
  });

  it('formats all-day and ranged availability', () => {
    expect(formatAvailabilityTimeRange(ALL_DAY_START_TIME, ALL_DAY_END_TIME)).toBe('All day');
    expect(formatAvailabilityTimeRange('09:00', '17:00')).toBe('9 AM – 5 PM');
  });

  it('persists all-day selection as sentinel times', () => {
    const blocks = dayAvailabilityToBlocks([
      {
        day_of_week: 1,
        enabled: true,
        all_day: true,
        start_time: '09:00',
        end_time: '17:00',
      },
    ]);

    expect(blocks).toEqual([
      { day_of_week: 1, start_time: ALL_DAY_START_TIME, end_time: ALL_DAY_END_TIME },
    ]);
  });

  it('loads all-day sentinel times back into editor state', () => {
    const days = blocksToDayAvailability([
      { day_of_week: 1, start_time: ALL_DAY_START_TIME, end_time: ALL_DAY_END_TIME },
    ]);

    expect(days.find((day) => day.day_of_week === 1)).toMatchObject({
      enabled: true,
      all_day: true,
      start_time: '09:00',
      end_time: '17:00',
    });
  });
});
