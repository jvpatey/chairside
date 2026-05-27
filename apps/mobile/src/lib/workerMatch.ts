import type { LiveJobPost, WorkerProfile } from '@chairside/api';
import { travelRadiusRangeToMaxKm } from '@chairside/config';
import { calculateJobMatch, type JobMatchBreakdown, type JobMatchContext } from '@chairside/core';

import { buildMatchDisplayContext } from '@/lib/matchDisplay';

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

export function computeJobMatchBreakdown(
  workerProfile: WorkerProfile | null,
  job: LiveJobPost,
): JobMatchBreakdown | null {
  if (!workerProfile) return null;

  return calculateJobMatch({
    postRoleType: job.role_type,
    workerRoleType: workerProfile.role_type,
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
  return {
    postRoleType: job.role_type,
    workerRoleType: workerProfile.role_type,
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
