import type { ClinicSummary, LiveJobPost, LiveShiftPost } from '@chairside/api';
import { formatJobPostCardMeta, getRoleTypeLabel } from '@chairside/config';
import type { MatchTier } from '@chairside/core';

import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import type { EnrichedLiveJobPost, EnrichedLiveShiftPost } from '@/lib/workerBrowseFilters';

export type WorkerMapPostKind = 'job' | 'shift';

export type WorkerMapItem = {
  kind: WorkerMapPostKind;
  id: string;
  clinicId: string;
  clinicName: string;
  city: string | null;
  province: string;
  specialty: string;
  logoStoragePath: string | null;
  latitude: number;
  longitude: number;
  roleType: string;
  roleLabel: string;
  title: string;
  pay: string | null;
  detail: string | null;
  distanceKm: number | null;
  distanceLabel: string | null;
  isSaved: boolean;
  hasApplied: boolean;
  matchTier: MatchTier | null;
};

export type WorkerMapClinicGroup = {
  clinicId: string;
  clinicName: string;
  city: string | null;
  province: string;
  logoStoragePath: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  distanceLabel: string | null;
  items: WorkerMapItem[];
  jobCount: number;
  shiftCount: number;
  hasSaved: boolean;
  hasApplied: boolean;
};

export function hasMappableClinicCoordinates(
  clinic: Pick<ClinicSummary, 'latitude' | 'longitude'> | null | undefined,
): clinic is ClinicSummary & { latitude: number; longitude: number } {
  return clinic?.latitude != null && clinic?.longitude != null;
}

export function liveJobToMapItem(
  job: EnrichedLiveJobPost,
  savedJobIds: ReadonlySet<string>,
  appliedJobIds: ReadonlySet<string>,
): WorkerMapItem | null {
  if (!hasMappableClinicCoordinates(job.clinic)) return null;

  return {
    kind: 'job',
    id: job.id,
    clinicId: job.clinic.clinic_id,
    clinicName: job.clinic.clinic_name,
    city: job.clinic.city,
    province: job.clinic.province,
    specialty: job.clinic.specialty,
    logoStoragePath: job.clinic.logo_storage_path,
    latitude: job.clinic.latitude,
    longitude: job.clinic.longitude,
    roleType: job.role_type,
    roleLabel: getRoleTypeLabel(job.role_type),
    title: job.title,
    pay: job.wage_range?.trim() || null,
    detail: formatJobPostCardMeta(job) || null,
    distanceKm: job.distanceKm,
    distanceLabel: job.distanceLabel,
    isSaved: savedJobIds.has(job.id),
    hasApplied: appliedJobIds.has(job.id),
    matchTier: job.matchTier,
  };
}

export function liveShiftToMapItem(
  shift: EnrichedLiveShiftPost,
  savedShiftIds: ReadonlySet<string>,
): WorkerMapItem | null {
  if (!hasMappableClinicCoordinates(shift.clinic)) return null;

  return {
    kind: 'shift',
    id: shift.id,
    clinicId: shift.clinic.clinic_id,
    clinicName: shift.clinic.clinic_name,
    city: shift.clinic.city,
    province: shift.clinic.province,
    specialty: shift.clinic.specialty,
    logoStoragePath: shift.clinic.logo_storage_path,
    latitude: shift.clinic.latitude,
    longitude: shift.clinic.longitude,
    roleType: shift.role_type,
    roleLabel: getRoleTypeLabel(shift.role_type),
    title: formatShiftPostRoleTitle(shift.role_type),
    pay: shift.compensation?.trim() || null,
    detail: formatShiftPostMeta(shift) || null,
    distanceKm: shift.distanceKm,
    distanceLabel: shift.distanceLabel,
    isSaved: savedShiftIds.has(shift.id),
    hasApplied: false,
    matchTier: null,
  };
}

export function toWorkerMapItemsFromJobs(
  jobs: EnrichedLiveJobPost[],
  savedJobIds: ReadonlySet<string>,
  appliedJobIds: ReadonlySet<string>,
): WorkerMapItem[] {
  return jobs
    .map((job) => liveJobToMapItem(job, savedJobIds, appliedJobIds))
    .filter((item): item is WorkerMapItem => item != null);
}

export function toWorkerMapItemsFromShifts(
  shifts: EnrichedLiveShiftPost[],
  savedShiftIds: ReadonlySet<string>,
): WorkerMapItem[] {
  return shifts
    .map((shift) => liveShiftToMapItem(shift, savedShiftIds))
    .filter((item): item is WorkerMapItem => item != null);
}

export function groupWorkerMapItemsByClinic(items: WorkerMapItem[]): WorkerMapClinicGroup[] {
  const groups = new Map<string, WorkerMapClinicGroup>();

  for (const item of items) {
    const existing = groups.get(item.clinicId);
    if (existing) {
      existing.items.push(item);
      if (item.kind === 'job') existing.jobCount += 1;
      if (item.kind === 'shift') existing.shiftCount += 1;
      existing.hasSaved = existing.hasSaved || item.isSaved;
      existing.hasApplied = existing.hasApplied || item.hasApplied;
      if (
        item.distanceKm != null &&
        (existing.distanceKm == null || item.distanceKm < existing.distanceKm)
      ) {
        existing.distanceKm = item.distanceKm;
        existing.distanceLabel = item.distanceLabel;
      }
      continue;
    }

    groups.set(item.clinicId, {
      clinicId: item.clinicId,
      clinicName: item.clinicName,
      city: item.city,
      province: item.province,
      logoStoragePath: item.logoStoragePath,
      latitude: item.latitude,
      longitude: item.longitude,
      distanceKm: item.distanceKm,
      distanceLabel: item.distanceLabel,
      items: [item],
      jobCount: item.kind === 'job' ? 1 : 0,
      shiftCount: item.kind === 'shift' ? 1 : 0,
      hasSaved: item.isSaved,
      hasApplied: item.hasApplied,
    });
  }

  return [...groups.values()].sort((a, b) => {
    const distanceCompare = compareDistanceAsc(a.distanceKm, b.distanceKm);
    if (distanceCompare !== 0) return distanceCompare;
    return a.clinicName.localeCompare(b.clinicName);
  });
}

export function countUnmappablePosts(posts: (LiveJobPost | LiveShiftPost)[]): number {
  return posts.filter((post) => !hasMappableClinicCoordinates(post.clinic)).length;
}

function compareDistanceAsc(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}
