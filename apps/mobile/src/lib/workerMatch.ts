import type { LiveJobPost, LiveShiftPost, WorkerProfile } from '@chairside/api';
import { travelRadiusRangeToMaxKm } from '@chairside/config';
import { calculateMatchScore } from '@chairside/core';

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

export function computeListingMatchBreakdown(
  workerProfile: WorkerProfile | null,
  post: LiveJobPost | LiveShiftPost,
): ReturnType<typeof calculateMatchScore> | null {
  if (!workerProfile) return null;

  return calculateMatchScore({
    postRoleType: post.role_type,
    postSoftware: 'software_used' in post ? post.software_used : [],
    workerRoleType: workerProfile.role_type,
    workerSoftware: workerProfile.software_used,
    workerTravelRadiusKm:
      travelRadiusRangeToMaxKm(workerProfile.travel_radius_range) ??
      workerProfile.travel_radius_km,
    distanceKm: haversineKm(
      workerProfile.latitude,
      workerProfile.longitude,
      post.clinic.latitude,
      post.clinic.longitude,
    ),
  });
}

export function computeListingMatchScore(
  workerProfile: WorkerProfile | null,
  post: LiveJobPost | LiveShiftPost,
): number | null {
  return computeListingMatchBreakdown(workerProfile, post)?.overall ?? null;
}
