import { formatTime12h, normalizeTime24h, parseTime24h } from '@/lib/time';

export type ScheduleDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type ScheduleTimeRange = {
  startTime: string;
  endTime: string;
};

export type DaySchedules = Partial<Record<ScheduleDay, ScheduleTimeRange>>;

export const SCHEDULE_DAY_ORDER: ScheduleDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const SCHEDULE_DAY_LABELS: Record<ScheduleDay, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

const LABEL_TO_DAY: Record<string, ScheduleDay> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

function formatDaySelection(days: ScheduleDay[]): string {
  const indices = days.map((day) => SCHEDULE_DAY_ORDER.indexOf(day)).sort((a, b) => a - b);
  if (indices.length === 0) return '';

  const groups: [number, number][] = [];
  let start = indices[0];
  let end = indices[0];

  for (let index = 1; index < indices.length; index++) {
    if (indices[index] === end + 1) {
      end = indices[index];
      continue;
    }
    groups.push([start, end]);
    start = indices[index];
    end = indices[index];
  }
  groups.push([start, end]);

  return groups
    .map(([groupStart, groupEnd]) => {
      const startLabel = SCHEDULE_DAY_LABELS[SCHEDULE_DAY_ORDER[groupStart]];
      const endLabel = SCHEDULE_DAY_LABELS[SCHEDULE_DAY_ORDER[groupEnd]];
      return groupStart === groupEnd ? startLabel : `${startLabel}–${endLabel}`;
    })
    .join(', ');
}

function timeKey(schedule: ScheduleTimeRange | undefined): string {
  return `${schedule?.startTime ?? ''}|${schedule?.endTime ?? ''}`;
}

function formatDaySegment(days: ScheduleDay[], schedule: ScheduleTimeRange | undefined): string {
  const dayPart = formatDaySelection(days);
  const start = formatTime12h(schedule?.startTime ?? '');
  const end = formatTime12h(schedule?.endTime ?? '');

  if (dayPart && start && end) return `${dayPart} ${start} – ${end}`;
  if (dayPart) return dayPart;
  return '';
}

export function buildScheduleString(
  days: ScheduleDay[],
  daySchedules: DaySchedules,
  notes: string,
): string {
  const activeDays = SCHEDULE_DAY_ORDER.filter((day) => days.includes(day));
  if (activeDays.length === 0) {
    return notes.trim();
  }

  const segments: { days: ScheduleDay[]; schedule: ScheduleTimeRange | undefined }[] = [];

  for (const day of activeDays) {
    const schedule = daySchedules[day];
    const last = segments[segments.length - 1];
    const previousDay = last?.days[last.days.length - 1];
    const previousIndex = previousDay ? SCHEDULE_DAY_ORDER.indexOf(previousDay) : -1;
    const isConsecutive = previousIndex >= 0 && SCHEDULE_DAY_ORDER.indexOf(day) === previousIndex + 1;
    const sameTimes = last && timeKey(last.schedule) === timeKey(schedule);

    if (last && isConsecutive && sameTimes) {
      last.days.push(day);
    } else {
      segments.push({ days: [day], schedule });
    }
  }

  const parts = segments
    .map((segment) => formatDaySegment(segment.days, segment.schedule))
    .filter(Boolean);
  const notePart = notes.trim();
  if (notePart) parts.push(notePart);

  return parts.join(' · ');
}

function parseTime12hTo24h(value: string): string | null {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(value.trim());
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] ?? '00';
  const period = match[3]!.toUpperCase();

  if (hours < 1 || hours > 12) return null;

  if (period === 'AM') {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }

  return normalizeTime24h(`${hours}:${minutes}`);
}

function expandDayLabel(dayPart: string): ScheduleDay[] {
  const trimmed = dayPart.trim();
  const rangeMatch = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)–(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/.exec(trimmed);
  if (rangeMatch) {
    const startIndex = SCHEDULE_DAY_ORDER.indexOf(LABEL_TO_DAY[rangeMatch[1]]!);
    const endIndex = SCHEDULE_DAY_ORDER.indexOf(LABEL_TO_DAY[rangeMatch[2]]!);
    if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) return [];
    return SCHEDULE_DAY_ORDER.slice(startIndex, endIndex + 1);
  }

  const single = LABEL_TO_DAY[trimmed];
  return single ? [single] : [];
}

const SCHEDULE_SEGMENT_PATTERN =
  /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:–(Mon|Tue|Wed|Thu|Fri|Sat|Sun))?\s+(.+)\s+–\s+(.+)$/;

export type ParsedSchedule = {
  parsed: boolean;
  days: ScheduleDay[];
  daySchedules: DaySchedules;
  hoursMode: 'same' | 'individual';
  sharedSchedule: ScheduleTimeRange;
  notes: string;
};

export function parseScheduleString(value: string): ParsedSchedule {
  const empty: ParsedSchedule = {
    parsed: false,
    days: [],
    daySchedules: {},
    hoursMode: 'same',
    sharedSchedule: { startTime: '', endTime: '' },
    notes: value.trim(),
  };

  const trimmed = value.trim();
  if (!trimmed) {
    return { ...empty, notes: '' };
  }

  const parts = trimmed.split(' · ').map((part) => part.trim()).filter(Boolean);
  const noteParts: string[] = [];
  const daySchedules: DaySchedules = {};
  const daysSet = new Set<ScheduleDay>();

  for (const part of parts) {
    const match = SCHEDULE_SEGMENT_PATTERN.exec(part);
    if (!match) {
      noteParts.push(part);
      continue;
    }

    const dayPart = match[2] ? `${match[1]}–${match[2]}` : match[1]!;
    const startTime = parseTime12hTo24h(match[3]!);
    const endTime = parseTime12hTo24h(match[4]!);
    const expandedDays = expandDayLabel(dayPart);

    if (!startTime || !endTime || expandedDays.length === 0) {
      noteParts.push(part);
      continue;
    }

    for (const day of expandedDays) {
      daysSet.add(day);
      daySchedules[day] = { startTime, endTime };
    }
  }

  const days = SCHEDULE_DAY_ORDER.filter((day) => daysSet.has(day));
  if (days.length === 0) {
    return empty;
  }

  const timeKeys = new Set(days.map((day) => timeKey(daySchedules[day])));
  const hoursMode = timeKeys.size <= 1 ? 'same' : 'individual';
  const firstDay = days[0]!;
  const sharedSchedule = daySchedules[firstDay] ?? { startTime: '', endTime: '' };

  return {
    parsed: true,
    days,
    daySchedules,
    hoursMode,
    sharedSchedule,
    notes: noteParts.join(' · '),
  };
}

export function isInvalidWageRange(
  min: string,
  max: string,
  payType: 'hourly' | 'commission' | 'discuss',
): boolean {
  if (payType !== 'hourly') return false;
  if (!min || !max) return false;
  return Number(min) > Number(max);
}
