import type { ClinicProfile, LiveJobPost, LiveShiftPost } from '@chairside/api';
import {
  formatJobPostCardMeta,
  getRoleTypeLabel,
} from '@chairside/config';

import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import type { RoleTypeFilter, WorkerDistanceFilter } from '@/lib/postingFilters';

export type ClinicDiscoverSort = 'distance' | 'newest';

export type ClinicDiscoverFiltersState = {
  searchQuery: string;
  roleTypeFilter: RoleTypeFilter;
  sort: ClinicDiscoverSort;
  distanceFilter: WorkerDistanceFilter;
};

/** Fixed near-me radius for clinic Discover (no worker travel preference). */
export const CLINIC_DISCOVER_NEAR_ME_RADIUS_KM = 50;

export const CLINIC_DISCOVER_SORT_OPTIONS: { value: ClinicDiscoverSort; label: string }[] = [
  { value: 'distance', label: 'Nearest' },
  { value: 'newest', label: 'Newest' },
];

export const DEFAULT_CLINIC_DISCOVER_FILTERS: ClinicDiscoverFiltersState = {
  searchQuery: '',
  roleTypeFilter: 'all',
  sort: 'distance',
  distanceFilter: 'all',
};

export type EnrichedClinicDiscoverJob = LiveJobPost & {
  distanceKm: number | null;
  distanceLabel: string | null;
};

export type EnrichedClinicDiscoverShift = LiveShiftPost & {
  distanceKm: number | null;
  distanceLabel: string | null;
};

function haversineKm(
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined,
): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceLabel(distanceKm: number | null | undefined): string | null {
  if (distanceKm == null) return null;
  if (distanceKm < 1) return 'Less than 1 km away';
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km away`;
  return `${Math.round(distanceKm)} km away`;
}

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

function matchesDistanceFilter(
  distanceKm: number | null,
  distanceFilter: WorkerDistanceFilter,
): boolean {
  switch (distanceFilter) {
    case 'all':
      return true;
    case 'near_me':
      return distanceKm != null && distanceKm <= CLINIC_DISCOVER_NEAR_ME_RADIUS_KM;
    case 'distance_available':
      return distanceKm != null;
  }
}

function compareDistanceAsc(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

function getClinicDistanceKm(
  viewerClinic: Pick<ClinicProfile, 'latitude' | 'longitude'> | null | undefined,
  listingClinic: { latitude: number | null; longitude: number | null } | null | undefined,
): number | null {
  if (!viewerClinic || !listingClinic) return null;
  return haversineKm(
    viewerClinic.latitude,
    viewerClinic.longitude,
    listingClinic.latitude,
    listingClinic.longitude,
  );
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

function enrichJob(
  job: LiveJobPost,
  viewerClinic: ClinicProfile | null,
): EnrichedClinicDiscoverJob {
  const distanceKm = getClinicDistanceKm(viewerClinic, job.clinic);
  return {
    ...job,
    distanceKm,
    distanceLabel: formatDistanceLabel(distanceKm),
  };
}

function enrichShift(
  shift: LiveShiftPost,
  viewerClinic: ClinicProfile | null,
): EnrichedClinicDiscoverShift {
  const distanceKm = getClinicDistanceKm(viewerClinic, shift.clinic);
  return {
    ...shift,
    distanceKm,
    distanceLabel: formatDistanceLabel(distanceKm),
  };
}

export function getDefaultClinicDiscoverSort(
  viewerClinic: Pick<ClinicProfile, 'latitude' | 'longitude'> | null | undefined,
): ClinicDiscoverSort {
  return viewerClinic?.latitude != null && viewerClinic?.longitude != null
    ? 'distance'
    : 'newest';
}

export function countClinicDiscoverFilterChanges(
  filters: ClinicDiscoverFiltersState,
  defaults: ClinicDiscoverFiltersState = DEFAULT_CLINIC_DISCOVER_FILTERS,
): number {
  return (
    (filters.roleTypeFilter === defaults.roleTypeFilter ? 0 : 1) +
    (filters.sort === defaults.sort ? 0 : 1) +
    (filters.distanceFilter === defaults.distanceFilter ? 0 : 1) +
    (normalizeSearchQuery(filters.searchQuery) ? 1 : 0)
  );
}

export function getClinicDiscoverSortLabel(sort: ClinicDiscoverSort): string {
  return sort === 'distance' ? 'nearest first' : 'newest first';
}

export function filterClinicDiscoverJobs(
  jobs: LiveJobPost[],
  viewerClinic: ClinicProfile | null,
  filters: ClinicDiscoverFiltersState,
): EnrichedClinicDiscoverJob[] {
  const query = normalizeSearchQuery(filters.searchQuery);

  const filtered = jobs
    .map((job) => enrichJob(job, viewerClinic))
    .filter((job) => {
      if (!matchesRoleTypeFilter(job, filters.roleTypeFilter)) return false;
      if (!matchesDistanceFilter(job.distanceKm, filters.distanceFilter)) return false;
      return matchesTextSearch(buildJobSearchHaystack(job), query);
    });

  if (filters.sort === 'distance') {
    return filtered.sort((left, right) => {
      const byDistance = compareDistanceAsc(left.distanceKm, right.distanceKm);
      if (byDistance !== 0) return byDistance;
      return right.created_at.localeCompare(left.created_at);
    });
  }

  return filtered.sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export function filterClinicDiscoverShifts(
  shifts: LiveShiftPost[],
  viewerClinic: ClinicProfile | null,
  filters: ClinicDiscoverFiltersState,
): EnrichedClinicDiscoverShift[] {
  const query = normalizeSearchQuery(filters.searchQuery);

  const filtered = shifts
    .map((shift) => enrichShift(shift, viewerClinic))
    .filter((shift) => {
      if (!matchesRoleTypeFilter(shift, filters.roleTypeFilter)) return false;
      if (!matchesDistanceFilter(shift.distanceKm, filters.distanceFilter)) return false;
      return matchesTextSearch(buildShiftSearchHaystack(shift), query);
    });

  if (filters.sort === 'distance') {
    return filtered.sort((left, right) => {
      const byDistance = compareDistanceAsc(left.distanceKm, right.distanceKm);
      if (byDistance !== 0) return byDistance;
      return left.shift_date.localeCompare(right.shift_date);
    });
  }

  return filtered.sort((left, right) => left.shift_date.localeCompare(right.shift_date));
}
