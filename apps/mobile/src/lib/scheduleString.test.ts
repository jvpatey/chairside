import { describe, expect, it } from 'vitest';

import {
  buildScheduleString,
  isInvalidWageRange,
  parseScheduleString,
} from '@/lib/scheduleString';

describe('scheduleString', () => {
  it('builds and parses a shared weekday schedule', () => {
    const built = buildScheduleString(
      ['mon', 'tue', 'wed'],
      {
        mon: { startTime: '09:00', endTime: '17:00' },
        tue: { startTime: '09:00', endTime: '17:00' },
        wed: { startTime: '09:00', endTime: '17:00' },
      },
      '',
    );

    expect(built).toBe('Mon–Wed 9 AM – 5 PM');

    const parsed = parseScheduleString(built);
    expect(parsed.parsed).toBe(true);
    expect(parsed.days).toEqual(['mon', 'tue', 'wed']);
    expect(parsed.hoursMode).toBe('same');
    expect(parsed.sharedSchedule).toEqual({ startTime: '09:00', endTime: '17:00' });
    expect(parsed.notes).toBe('');
  });

  it('round-trips schedule with notes', () => {
    const built = buildScheduleString(
      ['mon', 'fri'],
      {
        mon: { startTime: '08:00', endTime: '16:00' },
        fri: { startTime: '08:00', endTime: '16:00' },
      },
      'alternating Saturdays',
    );

    expect(built).toContain('Mon');
    expect(built).toContain('Fri');
    expect(built).toContain('alternating Saturdays');

    const parsed = parseScheduleString(built);
    expect(parsed.parsed).toBe(true);
    expect(parsed.days).toEqual(['mon', 'fri']);
    expect(parsed.notes).toBe('alternating Saturdays');
  });

  it('falls back to notes-only for legacy free text', () => {
    const parsed = parseScheduleString('Flexible schedule, discuss at interview');
    expect(parsed.parsed).toBe(false);
    expect(parsed.days).toEqual([]);
    expect(parsed.notes).toBe('Flexible schedule, discuss at interview');
  });

  it('detects invalid wage ranges', () => {
    expect(isInvalidWageRange('50', '40', 'hourly')).toBe(true);
    expect(isInvalidWageRange('40', '50', 'hourly')).toBe(false);
    expect(isInvalidWageRange('50', '40', 'commission')).toBe(false);
  });
});
