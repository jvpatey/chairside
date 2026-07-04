import type { CalendarEvent, CalendarEventKind } from '@chairside/api';

import { isSameDay, parseISODate, startOfDay, toISODate } from '@/lib/dates';
import { formatTime12h, formatTimeRangePreview } from '@/lib/time';

export type CalendarDayIndicators = {
  hasInterview: boolean;
  hasConfirmedFillIn: boolean;
};

export function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function buildCalendarCells(viewMonth: Date): (Date | null)[] {
  const first = monthStart(viewMonth);
  const leading = first.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: leading }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const bucket = grouped.get(event.dateKey) ?? [];
    bucket.push(event);
    grouped.set(event.dateKey, bucket);
  }
  for (const [key, bucket] of grouped) {
    grouped.set(
      key,
      [...bucket].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    );
  }
  return grouped;
}

export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const grouped = groupEventsByDate(events);
  return grouped.get(toISODate(date)) ?? [];
}

export function getDayIndicators(
  events: CalendarEvent[],
  date: Date,
): CalendarDayIndicators {
  const dayEvents = getEventsForDate(events, date);
  return {
    hasInterview: dayEvents.some((event) => event.kind === 'interview'),
    hasConfirmedFillIn: dayEvents.some((event) => event.kind === 'confirmed_fill_in'),
  };
}

export function formatCalendarEventTime(event: CalendarEvent): string {
  if (event.kind === 'confirmed_fill_in') {
    if (event.shiftStartTime && event.shiftEndTime) {
      return formatTimeRangePreview(event.shiftStartTime, event.shiftEndTime) ?? 'All day';
    }
    if (event.shiftStartTime) {
      return formatTime12h(event.shiftStartTime) ?? 'All day';
    }
    return 'All day';
  }

  const parsed = new Date(event.startsAt);
  if (Number.isNaN(parsed.getTime())) return 'Scheduled';
  const start = parsed.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (!event.durationMinutes) return start;
  const endDate = new Date(parsed.getTime() + event.durationMinutes * 60_000);
  const end = endDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${start} – ${end}`;
}

export function calendarEventKindLabel(kind: CalendarEventKind): string {
  return kind === 'interview' ? 'Interview' : 'Confirmed fill-in';
}

export function calendarEventAccent(kind: CalendarEventKind): 'primary' | 'secondary' {
  return kind === 'interview' ? 'primary' : 'secondary';
}

export function parseInitialCalendarDate(value?: string | null): Date {
  const parsed = value ? parseISODate(value) : null;
  return parsed ?? startOfDay(new Date());
}

export function isSelectedCalendarDay(selected: Date, date: Date): boolean {
  return isSameDay(selected, date);
}

export function filterUpcomingInterviewEvents(events: CalendarEvent[]): CalendarEvent[] {
  const today = startOfDay(new Date());
  return events.filter((event) => {
    if (event.kind !== 'interview') return false;
    const eventDate = parseISODate(event.dateKey);
    if (!eventDate) return false;
    return eventDate.getTime() >= today.getTime();
  });
}

export function countEventsInMonth(events: CalendarEvent[], viewMonth: Date): number {
  const month = viewMonth.getMonth();
  const year = viewMonth.getFullYear();
  return events.filter((event) => {
    const parsed = parseISODate(event.dateKey);
    if (!parsed) return false;
    return parsed.getMonth() === month && parsed.getFullYear() === year;
  }).length;
}
