import type { JobPost, ShiftPost } from '@chairside/api';
import type { RoleType } from '@chairside/config';
import { ROLE_TYPE_OPTIONS, formatDisplayLabel } from '@chairside/config';

import { parseISODate, startOfDay, todayISO } from '@/lib/dates';

export type JobStatusFilter = 'active' | 'paused' | 'archived' | 'all';

export type ShiftStatusFilter = 'open' | 'filled' | 'closed' | 'all';

export type ShiftDateFilter = 'all' | 'today' | 'upcoming' | 'past';

export type RoleTypeFilter = 'all' | RoleType;

export const JOB_STATUS_FILTER_OPTIONS: { value: JobStatusFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];

export const SHIFT_STATUS_FILTER_OPTIONS: { value: ShiftStatusFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'filled', label: 'Filled' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
];

export const SHIFT_DATE_FILTER_OPTIONS: { value: ShiftDateFilter; label: string }[] = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

export const ROLE_TYPE_FILTER_OPTIONS: { value: RoleTypeFilter; label: string }[] = [
  { value: 'all', label: 'All roles' },
  ...ROLE_TYPE_OPTIONS.map((option) => ({
    value: option.value as RoleTypeFilter,
    label: formatDisplayLabel(option.value),
  })),
];

const COMPACT_ROLE_TYPE_LABELS: Partial<Record<RoleType, string>> = {
  hygienist: 'Hygienist',
  assistant: 'Assistant',
  admin: 'Admin',
  office_manager: 'Manager',
  treatment_coordinator: 'Coordinator',
};

export const COMPACT_ROLE_TYPE_FILTER_OPTIONS: { value: RoleTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...ROLE_TYPE_OPTIONS.map((option) => ({
    value: option.value as RoleTypeFilter,
    label: COMPACT_ROLE_TYPE_LABELS[option.value] ?? option.label,
  })),
];

function matchesRoleTypeFilter<T extends { role_type: RoleType }>(
  item: T,
  roleTypeFilter: RoleTypeFilter,
): boolean {
  return roleTypeFilter === 'all' || item.role_type === roleTypeFilter;
}

function matchesShiftStatus(shift: ShiftPost, statusFilter: ShiftStatusFilter): boolean {
  switch (statusFilter) {
    case 'open':
      return shift.status === 'live';
    case 'filled':
      return shift.status === 'filled';
    case 'closed':
      return shift.status === 'closed' || shift.status === 'draft';
    case 'all':
      return true;
  }
}

function matchesShiftDate(shift: ShiftPost, dateFilter: ShiftDateFilter): boolean {
  if (dateFilter === 'all') return true;

  const shiftDate = parseISODate(shift.shift_date);
  if (!shiftDate) return false;

  const today = startOfDay(new Date());
  const todayTime = today.getTime();
  const shiftTime = shiftDate.getTime();

  switch (dateFilter) {
    case 'today':
      return shift.shift_date === todayISO();
    case 'upcoming':
      return shiftTime > todayTime;
    case 'past':
      return shiftTime < todayTime;
    case 'all':
      return true;
  }
}

export function filterJobPosts(
  jobs: JobPost[],
  statusFilter: JobStatusFilter,
  roleTypeFilter: RoleTypeFilter,
): JobPost[] {
  const byStatus = (() => {
    switch (statusFilter) {
      case 'active':
        return jobs.filter((job) => job.status === 'live');
      case 'paused':
        return jobs.filter((job) => job.status === 'paused');
      case 'archived':
        return jobs.filter((job) => job.status === 'filled' || job.status === 'closed');
      case 'all':
        return jobs;
    }
  })();

  return byStatus.filter((job) => matchesRoleTypeFilter(job, roleTypeFilter));
}

export function filterShiftPosts(
  shifts: ShiftPost[],
  statusFilter: ShiftStatusFilter,
  roleTypeFilter: RoleTypeFilter,
  dateFilter: ShiftDateFilter,
): ShiftPost[] {
  return shifts
    .filter(
      (shift) =>
        matchesShiftStatus(shift, statusFilter) &&
        matchesRoleTypeFilter(shift, roleTypeFilter) &&
        matchesShiftDate(shift, dateFilter),
    )
    .sort((a, b) => {
      const dateCompare = a.shift_date.localeCompare(b.shift_date);
      if (dateCompare !== 0) return dateCompare;
      return b.created_at.localeCompare(a.created_at);
    });
}
