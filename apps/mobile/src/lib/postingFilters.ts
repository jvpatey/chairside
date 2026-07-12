import type { JobPost, ShiftPost } from '@chairside/api';
import type { RoleType } from '@chairside/config';
import { ROLE_TYPE_OPTIONS, SOFTWARE_OPTIONS, formatDisplayLabel } from '@chairside/config';
import type { MatchTier } from '@chairside/core';

import { parseISODate, startOfDay, todayISO } from '@/lib/dates';

export type JobStatusFilter = 'live' | 'paused' | 'all';

export type ShiftStatusFilter = 'open' | 'filled' | 'closed' | 'expired' | 'all';

export type ShiftDateFilter = 'all' | 'today' | 'upcoming' | 'past';

export type RoleTypeFilter = 'all' | RoleType;

export type JobPostedSort = 'newest' | 'oldest';

export const JOB_POSTED_SORT_OPTIONS: { value: JobPostedSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

export type WorkerBrowseSort = 'recommended' | 'distance' | 'newest' | 'oldest';

export const WORKER_BROWSE_SORT_OPTIONS: { value: WorkerBrowseSort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'distance', label: 'Nearest' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
];

export type WorkerDistanceFilter = 'all' | 'near_me' | 'distance_available';

export const WORKER_DISTANCE_FILTER_OPTIONS: { value: WorkerDistanceFilter; label: string }[] = [
  { value: 'all', label: 'Any distance' },
  { value: 'near_me', label: 'Near me' },
  { value: 'distance_available', label: 'Has distance' },
];

export type WorkerMatchTierFilter = 'all' | MatchTier;

export const WORKER_MATCH_TIER_FILTER_OPTIONS: { value: WorkerMatchTierFilter; label: string }[] = [
  { value: 'all', label: 'All matches' },
  { value: 'strong', label: 'Strong' },
  { value: 'good', label: 'Good' },
  { value: 'partial', label: 'Partial' },
  { value: 'none', label: 'Not a match' },
];

export type PayListedFilter = 'all' | 'listed_only';

export const PAY_LISTED_FILTER_OPTIONS: { value: PayListedFilter; label: string }[] = [
  { value: 'all', label: 'Any pay' },
  { value: 'listed_only', label: 'Pay listed' },
];

export type WorkerSoftwareFilter = 'all' | (typeof SOFTWARE_OPTIONS)[number];

export const WORKER_SOFTWARE_FILTER_OPTIONS: { value: WorkerSoftwareFilter; label: string }[] = [
  { value: 'all', label: 'Any software' },
  ...SOFTWARE_OPTIONS.filter((option) => option !== 'None' && option !== 'Other').map((option) => ({
    value: option as WorkerSoftwareFilter,
    label: option,
  })),
];

export type WorkerAvailabilityFilter = 'all' | 'my_available_days';

export const WORKER_AVAILABILITY_FILTER_OPTIONS: {
  value: WorkerAvailabilityFilter;
  label: string;
}[] = [
  { value: 'all', label: 'Any day' },
  { value: 'my_available_days', label: 'My available days' },
];

export type SavedOnlyFilter = 'all' | 'saved_only';

export const SAVED_ONLY_FILTER_OPTIONS: { value: SavedOnlyFilter; label: string }[] = [
  { value: 'all', label: 'All postings' },
  { value: 'saved_only', label: 'Saved only' },
];

export function sortJobsByPostedDate<T extends { created_at: string }>(
  jobs: T[],
  sort: JobPostedSort,
): T[] {
  return [...jobs].sort((a, b) => {
    const compare = b.created_at.localeCompare(a.created_at);
    return sort === 'newest' ? compare : -compare;
  });
}

export const JOB_STATUS_FILTER_OPTIONS: { value: JobStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'paused', label: 'Paused' },
];

export function isMainListJob(job: JobPost): boolean {
  return job.status === 'live' || job.status === 'paused';
}

export function isArchivedJob(job: JobPost): boolean {
  return job.status === 'closed';
}

export function isFilledJob(job: JobPost): boolean {
  return job.status === 'filled';
}

function compareMainListJobs(a: JobPost, b: JobPost): number {
  if (a.status === 'live' && b.status !== 'live') return -1;
  if (a.status !== 'live' && b.status === 'live') return 1;
  return b.created_at.localeCompare(a.created_at);
}

export function filterJobPostsForMainList(
  jobs: JobPost[],
  statusFilter: JobStatusFilter,
  roleTypeFilter: RoleTypeFilter,
): JobPost[] {
  const mainJobs = jobs.filter(isMainListJob);

  const byStatus = (() => {
    switch (statusFilter) {
      case 'live':
        return mainJobs.filter((job) => job.status === 'live');
      case 'paused':
        return mainJobs.filter((job) => job.status === 'paused');
      case 'all':
        return mainJobs;
    }
  })();

  return byStatus
    .filter((job) => matchesRoleTypeFilter(job, roleTypeFilter))
    .sort(compareMainListJobs);
}

export function filterArchivedJobPosts(
  jobs: JobPost[],
  roleTypeFilter: RoleTypeFilter,
): JobPost[] {
  return jobs
    .filter(isArchivedJob)
    .filter((job) => matchesRoleTypeFilter(job, roleTypeFilter))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function filterFilledJobPosts(
  jobs: JobPost[],
  roleTypeFilter: RoleTypeFilter,
): JobPost[] {
  return jobs
    .filter(isFilledJob)
    .filter((job) => matchesRoleTypeFilter(job, roleTypeFilter))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function countMainListJobs(jobs: JobPost[]): number {
  return jobs.filter(isMainListJob).length;
}

export function countHistoryJobs(jobs: JobPost[]): { archived: number; filled: number } {
  return {
    archived: jobs.filter(isArchivedJob).length,
    filled: jobs.filter(isFilledJob).length,
  };
}

export const SHIFT_STATUS_FILTER_OPTIONS: { value: ShiftStatusFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'filled', label: 'Filled' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
];

/** History view: "Open" is replaced with "Expired" (past date, still live). */
export const HISTORY_SHIFT_STATUS_FILTER_OPTIONS: { value: ShiftStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'expired', label: 'Expired' },
  { value: 'filled', label: 'Filled' },
  { value: 'closed', label: 'Closed' },
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
    case 'expired':
      return shift.status === 'live' && matchesShiftDate(shift, 'past');
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

export type RolesBrowseMode = 'open' | 'applied' | 'saved';

export const ROLES_BROWSE_MODE_OPTIONS: { value: RolesBrowseMode; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'applied', label: 'Applied' },
  { value: 'saved', label: 'Saved' },
];

export type ClinicDiscoverTab = 'roles' | 'fill-ins';

export const CLINIC_DISCOVER_TAB_OPTIONS: { value: ClinicDiscoverTab; label: string }[] = [
  { value: 'roles', label: 'Roles' },
  { value: 'fill-ins', label: 'Fill-ins' },
];

export type WorkerBrowseViewMode = 'list' | 'map';

export const WORKER_BROWSE_VIEW_MODE_OPTIONS: { value: WorkerBrowseViewMode; label: string }[] = [
  { value: 'list', label: 'List' },
  { value: 'map', label: 'Map' },
];
