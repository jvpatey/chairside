import type { AvailabilityBlock, LiveJobPost, LiveShiftPost, WorkerProfile } from '@chairside/api';
import {
  formatJobPostCardMeta,
  getRoleTypeLabel,
} from '@chairside/config';
import { getMatchTierRank, isMatchableSoftware, normalizeSoftwareToken, type MatchTier } from '@chairside/core';

import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import {
  computeJobMatchBreakdown,
  formatDistanceLabel,
  getWorkerDistanceKm,
  getWorkerTravelRadiusKm,
  isWithinNearMeRadius,
} from '@/lib/workerMatch';
import type {
  PayListedFilter,
  RoleTypeFilter,
  SavedOnlyFilter,
  WorkerAvailabilityFilter,
  WorkerBrowseSort,
  WorkerDistanceFilter,
  WorkerMatchTierFilter,
  WorkerSoftwareFilter,
} from '@/lib/postingFilters';
import { sortWithPriorityFirst } from '@/lib/listingPriority';

export type WorkerRoleBrowseFiltersState = {
  searchQuery: string;
  roleTypeFilter: RoleTypeFilter;
  sort: WorkerBrowseSort;
  distanceFilter: WorkerDistanceFilter;
  softwareFilter: WorkerSoftwareFilter;
  payListedFilter: PayListedFilter;
  matchTierFilter: WorkerMatchTierFilter;
};

export type WorkerFillInBrowseFiltersState = {
  searchQuery: string;
  roleTypeFilter: RoleTypeFilter;
  sort: WorkerBrowseSort;
  distanceFilter: WorkerDistanceFilter;
  softwareFilter: WorkerSoftwareFilter;
  payListedFilter: PayListedFilter;
  availabilityFilter: WorkerAvailabilityFilter;
  savedOnlyFilter: SavedOnlyFilter;
};

export type EnrichedLiveJobPost = LiveJobPost & {
  distanceKm: number | null;
  distanceLabel: string | null;
  matchTier: MatchTier | null;
};

export type EnrichedLiveShiftPost = LiveShiftPost & {
  distanceKm: number | null;
  distanceLabel: string | null;
};

function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

function matchesTextSearch(haystack: string, query: string): boolean {
  if (!query) return true;
  return haystack.toLowerCase().includes(query);
}

function matchesRoleTypeFilter<T extends { role_type: string }>(
  item: T,
  roleTypeFilter: RoleTypeFilter,
): boolean {
  return roleTypeFilter === 'all' || item.role_type === roleTypeFilter;
}

function matchesPayListedFilter(
  value: string | null | undefined,
  payListedFilter: PayListedFilter,
): boolean {
  if (payListedFilter === 'all') return true;
  return Boolean(value?.trim());
}

function matchesSoftwareFilter(
  software: string[] | null | undefined,
  softwareFilter: WorkerSoftwareFilter,
): boolean {
  if (softwareFilter === 'all') return true;
  const target = normalizeSoftwareToken(softwareFilter);
  return (software ?? []).some(
    (item) => isMatchableSoftware(item) && normalizeSoftwareToken(item) === target,
  );
}

function matchesDistanceFilter(
  distanceKm: number | null,
  distanceFilter: WorkerDistanceFilter,
  travelRadiusKm: number | null,
): boolean {
  switch (distanceFilter) {
    case 'all':
      return true;
    case 'near_me':
      return isWithinNearMeRadius(distanceKm, travelRadiusKm);
    case 'distance_available':
      return distanceKm != null;
  }
}

function buildJobSearchHaystack(job: LiveJobPost): string {
  return [
    job.clinic.clinic_name,
    job.clinic.city,
    job.clinic.province,
    job.clinic.specialty,
    job.title,
    job.description,
    job.schedule,
    job.wage_range,
    job.specialty,
    formatJobPostCardMeta(job),
    ...(job.software_used ?? []),
    ...(job.clinic.software_used ?? []),
  ]
    .filter(Boolean)
    .join(' ');
}

function buildShiftSearchHaystack(shift: LiveShiftPost): string {
  return [
    shift.clinic.clinic_name,
    shift.clinic.city,
    shift.clinic.province,
    shift.clinic.specialty,
    getRoleTypeLabel(shift.role_type),
    shift.description,
    shift.compensation,
    formatShiftPostMeta(shift),
    shift.shift_date,
    ...(shift.clinic.software_used ?? []),
  ]
    .filter(Boolean)
    .join(' ');
}

function shiftWeekday(shiftDate: string): number {
  return new Date(`${shiftDate}T12:00:00`).getDay();
}

function compareDistanceAsc(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

function enrichJob(
  job: LiveJobPost,
  workerProfile: WorkerProfile | null,
): EnrichedLiveJobPost {
  const distanceKm = getWorkerDistanceKm(workerProfile, job.clinic);
  const matchBreakdown = workerProfile ? computeJobMatchBreakdown(workerProfile, job) : null;

  return {
    ...job,
    distanceKm,
    distanceLabel: formatDistanceLabel(distanceKm),
    matchTier: matchBreakdown?.tier ?? null,
  };
}

function enrichShift(
  shift: LiveShiftPost,
  workerProfile: WorkerProfile | null,
): EnrichedLiveShiftPost {
  const distanceKm = getWorkerDistanceKm(workerProfile, shift.clinic);

  return {
    ...shift,
    distanceKm,
    distanceLabel: formatDistanceLabel(distanceKm),
  };
}

function sortJobs(
  jobs: EnrichedLiveJobPost[],
  sort: WorkerBrowseSort,
): EnrichedLiveJobPost[] {
  return sortWithPriorityFirst(jobs, (a, b) => {
    switch (sort) {
      case 'recommended': {
        const tierCompare =
          getMatchTierRank(a.matchTier ?? 'none') - getMatchTierRank(b.matchTier ?? 'none');
        if (tierCompare !== 0) return tierCompare;
        const distanceCompare = compareDistanceAsc(a.distanceKm, b.distanceKm);
        if (distanceCompare !== 0) return distanceCompare;
        return b.created_at.localeCompare(a.created_at);
      }
      case 'distance': {
        const distanceCompare = compareDistanceAsc(a.distanceKm, b.distanceKm);
        if (distanceCompare !== 0) return distanceCompare;
        return b.created_at.localeCompare(a.created_at);
      }
      case 'oldest':
        return a.created_at.localeCompare(b.created_at);
      case 'newest':
      default:
        return b.created_at.localeCompare(a.created_at);
    }
  });
}

function sortShifts(
  shifts: EnrichedLiveShiftPost[],
  sort: WorkerBrowseSort,
): EnrichedLiveShiftPost[] {
  return sortWithPriorityFirst(shifts, (a, b) => {
    switch (sort) {
      case 'recommended':
      case 'distance': {
        const distanceCompare = compareDistanceAsc(a.distanceKm, b.distanceKm);
        if (distanceCompare !== 0) return distanceCompare;
        return a.shift_date.localeCompare(b.shift_date);
      }
      case 'oldest':
        return a.shift_date.localeCompare(b.shift_date);
      case 'newest':
      default:
        return b.shift_date.localeCompare(a.shift_date);
    }
  });
}

export function filterAndSortLiveJobs(
  jobs: LiveJobPost[],
  workerProfile: WorkerProfile | null,
  filters: WorkerRoleBrowseFiltersState,
): EnrichedLiveJobPost[] {
  const query = normalizeSearchQuery(filters.searchQuery);
  const travelRadiusKm = getWorkerTravelRadiusKm(workerProfile);

  const filtered = jobs
    .map((job) => enrichJob(job, workerProfile))
    .filter((job) => {
      if (!matchesRoleTypeFilter(job, filters.roleTypeFilter)) return false;
      if (!matchesTextSearch(buildJobSearchHaystack(job), query)) return false;
      if (!matchesDistanceFilter(job.distanceKm, filters.distanceFilter, travelRadiusKm)) {
        return false;
      }
      if (!matchesSoftwareFilter(job.software_used, filters.softwareFilter)) return false;
      if (!matchesPayListedFilter(job.wage_range, filters.payListedFilter)) return false;
      if (
        filters.matchTierFilter !== 'all' &&
        (job.matchTier ?? 'none') !== filters.matchTierFilter
      ) {
        return false;
      }
      return true;
    });

  return sortJobs(filtered, filters.sort);
}

export function filterAndSortLiveShifts(
  shifts: LiveShiftPost[],
  workerProfile: WorkerProfile | null,
  availabilityBlocks: AvailabilityBlock[],
  filters: WorkerFillInBrowseFiltersState,
): EnrichedLiveShiftPost[] {
  const query = normalizeSearchQuery(filters.searchQuery);
  const travelRadiusKm = getWorkerTravelRadiusKm(workerProfile);
  const availabilityDays = new Set(availabilityBlocks.map((block) => block.day_of_week));

  const filtered = shifts
    .map((shift) => enrichShift(shift, workerProfile))
    .filter((shift) => {
      if (!matchesRoleTypeFilter(shift, filters.roleTypeFilter)) return false;
      if (!matchesTextSearch(buildShiftSearchHaystack(shift), query)) return false;
      if (!matchesDistanceFilter(shift.distanceKm, filters.distanceFilter, travelRadiusKm)) {
        return false;
      }
      if (!matchesSoftwareFilter(shift.clinic.software_used, filters.softwareFilter)) return false;
      if (!matchesPayListedFilter(shift.compensation, filters.payListedFilter)) return false;
      if (filters.availabilityFilter === 'my_available_days') {
        if (availabilityDays.size === 0) return false;
        if (!availabilityDays.has(shiftWeekday(shift.shift_date))) return false;
      }
      return true;
    });

  return sortShifts(filtered, filters.sort);
}

export function countWorkerRoleBrowseFilterChanges(
  filters: WorkerRoleBrowseFiltersState,
  defaults: WorkerRoleBrowseFiltersState,
): number {
  let count = 0;
  if (filters.searchQuery.trim() !== defaults.searchQuery.trim()) count += 1;
  if (filters.roleTypeFilter !== defaults.roleTypeFilter) count += 1;
  if (filters.sort !== defaults.sort) count += 1;
  if (filters.distanceFilter !== defaults.distanceFilter) count += 1;
  if (filters.softwareFilter !== defaults.softwareFilter) count += 1;
  if (filters.payListedFilter !== defaults.payListedFilter) count += 1;
  if (filters.matchTierFilter !== defaults.matchTierFilter) count += 1;
  return count;
}

export function countWorkerFillInBrowseFilterChanges(
  filters: WorkerFillInBrowseFiltersState,
  defaults: WorkerFillInBrowseFiltersState,
): number {
  let count = 0;
  if (filters.searchQuery.trim() !== defaults.searchQuery.trim()) count += 1;
  if (filters.roleTypeFilter !== defaults.roleTypeFilter) count += 1;
  if (filters.sort !== defaults.sort) count += 1;
  if (filters.distanceFilter !== defaults.distanceFilter) count += 1;
  if (filters.softwareFilter !== defaults.softwareFilter) count += 1;
  if (filters.payListedFilter !== defaults.payListedFilter) count += 1;
  if (filters.availabilityFilter !== defaults.availabilityFilter) count += 1;
  if (filters.savedOnlyFilter !== defaults.savedOnlyFilter) count += 1;
  return count;
}

export const DEFAULT_WORKER_ROLE_BROWSE_FILTERS: WorkerRoleBrowseFiltersState = {
  searchQuery: '',
  roleTypeFilter: 'all',
  sort: 'recommended',
  distanceFilter: 'all',
  softwareFilter: 'all',
  payListedFilter: 'all',
  matchTierFilter: 'all',
};

export const DEFAULT_WORKER_FILLIN_BROWSE_FILTERS: WorkerFillInBrowseFiltersState = {
  searchQuery: '',
  roleTypeFilter: 'all',
  sort: 'recommended',
  distanceFilter: 'all',
  softwareFilter: 'all',
  payListedFilter: 'all',
  availabilityFilter: 'all',
  savedOnlyFilter: 'all',
};
