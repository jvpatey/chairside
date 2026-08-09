import type { AvailabilityBlockInput } from '@chairside/api';
import { DAY_OF_WEEK_OPTIONS } from '@chairside/config';

import { normalizeTime24h, formatTime12h } from '@/lib/time';

export const ALL_DAY_START_TIME = '00:00';
export const ALL_DAY_END_TIME = '23:59';

export type DayAvailability = {
  day_of_week: number;
  enabled: boolean;
  all_day: boolean;
  start_time: string;
  end_time: string;
};

export function isAllDayAvailability(startTime: string, endTime: string): boolean {
  return (
    normalizeTime24h(startTime.slice(0, 5)) === ALL_DAY_START_TIME &&
    normalizeTime24h(endTime.slice(0, 5)) === ALL_DAY_END_TIME
  );
}

export function formatAvailabilityTimeRange(startTime: string, endTime: string): string {
  if (isAllDayAvailability(startTime, endTime)) return 'All day';

  const start = formatTime12h(startTime.slice(0, 5)) ?? startTime;
  const end = formatTime12h(endTime.slice(0, 5)) ?? endTime;
  return `${start} – ${end}`;
}

export function createDefaultDayAvailability(): DayAvailability[] {
  return DAY_OF_WEEK_OPTIONS.map((day) => ({
    day_of_week: day.value,
    enabled: false,
    all_day: false,
    start_time: '09:00',
    end_time: '17:00',
  }));
}

export function blocksToDayAvailability(
  blocks: { day_of_week: number; start_time: string; end_time: string }[],
): DayAvailability[] {
  const defaults = createDefaultDayAvailability();
  if (blocks.length === 0) return defaults;

  return defaults.map((day) => {
    const block = blocks.find((item) => item.day_of_week === day.day_of_week);
    if (!block) return { ...day, enabled: false };
    const allDay = isAllDayAvailability(block.start_time, block.end_time);
    return {
      day_of_week: day.day_of_week,
      enabled: true,
      all_day: allDay,
      start_time: allDay
        ? '09:00'
        : normalizeTime24h(block.start_time.slice(0, 5)),
      end_time: allDay ? '17:00' : normalizeTime24h(block.end_time.slice(0, 5)),
    };
  });
}

export function dayAvailabilityToBlocks(days: DayAvailability[]): AvailabilityBlockInput[] {
  return days
    .filter((day) => day.enabled)
    .map((day) => ({
      day_of_week: day.day_of_week,
      start_time: day.all_day ? ALL_DAY_START_TIME : normalizeTime24h(day.start_time),
      end_time: day.all_day ? ALL_DAY_END_TIME : normalizeTime24h(day.end_time),
    }));
}
