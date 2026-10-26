import type { ShiftPost } from '@chairside/api';
import { getRoleTypeLabel } from '@chairside/config';

import { formatFillInPostTitle } from '@chairside/config';

import {
  addDays,
  formatShiftDateLabel,
  isSameDay,
  parseISODate,
  startOfDay,
} from '@/lib/dates';
import { formatTimeRangePreview } from '@/lib/time';

export function formatShiftPostRoleTitle(roleType: string): string {
  return getRoleTypeLabel(roleType);
}

export function formatFillInRoleLabel(shiftDate: string): string {
  return formatFillInPostTitle(shiftDate);
}

export function formatShiftPostDateLabel(shiftDate: string | null | undefined): string {
  if (!shiftDate?.trim()) return 'Date TBD';
  const date = parseISODate(shiftDate);
  if (!date) return shiftDate;

  const label = formatShiftDateLabel(date);
  const today = startOfDay(new Date());

  if (isSameDay(date, today)) return `Today · ${label}`;
  if (isSameDay(date, addDays(today, 1))) return `Tomorrow · ${label}`;
  return label;
}

export function formatShiftPostMeta(
  shift: Pick<ShiftPost, 'shift_date' | 'start_time' | 'end_time'>,
): string {
  const hasDate = Boolean(shift.shift_date?.trim());
  const hours = formatTimeRangePreview(shift.start_time, shift.end_time);
  if (!hasDate && !hours) return 'Schedule TBD';
  if (!hasDate) return hours!;
  const dateLabel = formatShiftPostDateLabel(shift.shift_date);
  return hours ? `${dateLabel} · ${hours}` : dateLabel;
}

/** Hours (and Today/Tomorrow when relevant) without repeating the written date. */
export function formatShiftPostTimeDetail(
  shift: Pick<ShiftPost, 'shift_date' | 'start_time' | 'end_time'>,
): string | null {
  const hours = formatTimeRangePreview(shift.start_time, shift.end_time);
  if (!hours) return null;

  const date = parseISODate(shift.shift_date);
  if (!date) return hours;

  const today = startOfDay(new Date());
  if (isSameDay(date, today)) return `Today · ${hours}`;
  if (isSameDay(date, addDays(today, 1))) return `Tomorrow · ${hours}`;
  return hours;
}
