import type { ShiftPost } from '@chairside/api';
import { getRoleTypeLabel } from '@chairside/config';

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

export function formatShiftPostDateLabel(shiftDate: string): string {
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
  const dateLabel = formatShiftPostDateLabel(shift.shift_date);
  const hours = formatTimeRangePreview(shift.start_time, shift.end_time);
  return hours ? `${dateLabel} · ${hours}` : dateLabel;
}
