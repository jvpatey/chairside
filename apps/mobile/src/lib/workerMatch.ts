import type { LiveJobPost, WorkerProfile } from '@chairside/api';
import { getWorkerRoleTypes } from '@chairside/api';
import { travelRadiusRangeToMaxKm } from '@chairside/config';
import { calculateJobMatch, type JobMatchBreakdown, type JobMatchContext } from '@chairside/core';

import { buildMatchDisplayContext } from '@/lib/matchDisplay';

export function haversineKm(
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

type ClinicCoordinates = {
  latitude: number | null;
  longitude: number | null;
};

export function getWorkerDistanceKm(
  workerProfile: Pick<WorkerProfile, 'latitude' | 'longitude'> | null | undefined,
  clinic: ClinicCoordinates | null | undefined,
): number | null {
  if (!workerProfile || !clinic) return null;
  return haversineKm(
    workerProfile.latitude,
    workerProfile.longitude,
    clinic.latitude,
    clinic.longitude,
  );
}

export function getWorkerTravelRadiusKm(
  workerProfile: Pick<WorkerProfile, 'travel_radius_range' | 'travel_radius_km'> | null | undefined,
): number | null {
  if (!workerProfile) return null;
  return (
    travelRadiusRangeToMaxKm(workerProfile.travel_radius_range) ?? workerProfile.travel_radius_km
  );
}

/** Fallback radius when the worker profile has coordinates but no travel radius set. */
export const NEAR_ME_FALLBACK_RADIUS_KM = 25;

export function isWithinNearMeRadius(
  distanceKm: number | null | undefined,
  travelRadiusKm: number | null | undefined,
): boolean {
  if (distanceKm == null) return false;
  const radius = travelRadiusKm ?? NEAR_ME_FALLBACK_RADIUS_KM;
  return distanceKm <= radius;
}

export function formatDistanceLabel(distanceKm: number | null | undefined): string | null {
  if (distanceKm == null) return null;
  if (distanceKm < 1) return 'Less than 1 km away';
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km away`;
  return `${Math.round(distanceKm)} km away`;
}

export function computeJobMatchBreakdown(
  workerProfile: WorkerProfile | null,
  job: LiveJobPost,
): JobMatchBreakdown | null {
  if (!workerProfile) return null;

  const workerRoleTypes = getWorkerRoleTypes(workerProfile);

  return calculateJobMatch({
    postRoleType: job.role_type,
    workerRoleTypes,
    workerRoleType: workerRoleTypes[0] ?? null,
    postEmploymentType: job.employment_type,
    workerPreferredEmploymentTypes: workerProfile.preferred_employment_types,
    postSoftware: job.software_used,
    workerSoftware: workerProfile.software_used,
    workerTravelRadiusKm:
      travelRadiusRangeToMaxKm(workerProfile.travel_radius_range) ??
      workerProfile.travel_radius_km,
    distanceKm: haversineKm(
      workerProfile.latitude,
      workerProfile.longitude,
      job.clinic.latitude,
      job.clinic.longitude,
    ),
  });
}

export function buildLiveJobMatchContext(
  workerProfile: WorkerProfile,
  job: LiveJobPost,
): JobMatchContext {
  const workerRoleTypes = getWorkerRoleTypes(workerProfile);

  return {
    postRoleType: job.role_type,
    workerRoleTypes,
    workerRoleType: workerRoleTypes[0] ?? null,
    postEmploymentType: job.employment_type,
    workerPreferredEmploymentTypes: workerProfile.preferred_employment_types,
    postSoftware: job.software_used,
    workerSoftware: workerProfile.software_used,
    workerTravelRadiusKm:
      travelRadiusRangeToMaxKm(workerProfile.travel_radius_range) ??
      workerProfile.travel_radius_km,
    distanceKm: haversineKm(
      workerProfile.latitude,
      workerProfile.longitude,
      job.clinic.latitude,
      job.clinic.longitude,
    ),
  };
}

export function buildLiveJobMatchDisplayContext(
  workerProfile: WorkerProfile,
  job: LiveJobPost,
) {
  return buildMatchDisplayContext(buildLiveJobMatchContext(workerProfile, job));
}
