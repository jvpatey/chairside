import type { CalendarEvent } from '@chairside/api';
import { describe, expect, it } from 'vitest';

import {
  buildCalendarCells,
  getDayIndicators,
  getEventsForDate,
  groupEventsByDate,
  isSelectedCalendarDay,
  monthStart,
} from '@/lib/calendarEvents';
import { parseISODate, startOfDay, toISODate } from '@/lib/dates';

describe('calendarEvents', () => {
  const sampleEvents: CalendarEvent[] = [
    {
      id: 'interview-1',
      kind: 'interview',
      startsAt: '2026-07-10T14:00:00.000Z',
      endsAt: '2026-07-10T15:00:00.000Z',
      title: 'Dental Hygienist',
      subtitle: 'Harbour Dental',
      status: 'interview_scheduled',
      applicationId: 'app-1',
      jobPostId: 'job-1',
      shiftPostId: null,
      postType: 'job',
      dateKey: '2026-07-10',
      location: 'Halifax, NS',
      counterpartName: 'Harbour Dental',
      roleType: 'dental_hygienist',
      shiftStartTime: null,
      shiftEndTime: null,
      durationMinutes: 60,
    },
    {
      id: 'fill-in-2',
      kind: 'confirmed_fill_in',
      startsAt: '2026-07-10T08:00:00',
      endsAt: '2026-07-10T17:00:00',
      title: 'Fill-in · 2026-07-10',
      subtitle: 'Smile Clinic',
      status: 'hired',
      applicationId: 'app-2',
      jobPostId: null,
      shiftPostId: 'shift-1',
      postType: 'shift',
      dateKey: '2026-07-10',
      location: 'Dartmouth, NS',
      counterpartName: 'Smile Clinic',
      roleType: 'dental_assistant',
      shiftStartTime: '08:00',
      shiftEndTime: '17:00',
      durationMinutes: null,
    },
    {
      id: 'fill-in-3',
      kind: 'confirmed_fill_in',
      startsAt: '2026-07-15T09:00:00',
      endsAt: '2026-07-15T17:00:00',
      title: 'Fill-in · 2026-07-15',
      subtitle: 'Smile Clinic',
      status: 'hired',
      applicationId: 'app-3',
      jobPostId: null,
      shiftPostId: 'shift-2',
      postType: 'shift',
      dateKey: '2026-07-15',
      location: 'Dartmouth, NS',
      counterpartName: 'Smile Clinic',
      roleType: 'dental_assistant',
      shiftStartTime: '09:00',
      shiftEndTime: '17:00',
      durationMinutes: null,
    },
  ];

  it('groups events by date and sorts within the day', () => {
    const grouped = groupEventsByDate(sampleEvents);
    expect(grouped.get('2026-07-10')).toHaveLength(2);
    expect(grouped.get('2026-07-15')).toHaveLength(1);
  });

  it('returns day indicators for mixed event days', () => {
    const date = parseISODate('2026-07-10')!;
    expect(getDayIndicators(sampleEvents, date)).toEqual({
      hasInterview: true,
      hasConfirmedFillIn: true,
    });
  });

  it('builds a month grid with leading blanks', () => {
    const cells = buildCalendarCells(monthStart(parseISODate('2026-07-01')!));
    expect(cells.length % 7).toBe(0);
    expect(cells.filter(Boolean)).toHaveLength(31);
  });

  it('filters events for a selected day', () => {
    const date = parseISODate('2026-07-15')!;
    expect(getEventsForDate(sampleEvents, date)).toHaveLength(1);
  });

  it('detects selected calendar day', () => {
    const selected = startOfDay(new Date(2026, 6, 10));
    const same = startOfDay(new Date(2026, 6, 10));
    const different = startOfDay(new Date(2026, 6, 11));
    expect(isSelectedCalendarDay(selected, same)).toBe(true);
    expect(isSelectedCalendarDay(selected, different)).toBe(false);
    expect(toISODate(selected)).toBe('2026-07-10');
  });
});
