import type { ClinicSummary, PostLocationSummary } from '@chairside/api';

import { hasMappableClinicCoordinates } from '@/lib/workerMapItems';
import { resolveWorkerPostLocationParts } from '@/lib/workerPostLocation';
import type { MapsDestination } from '@/lib/mapsDirectionsUrls';

type WorkerPostMapsInput = {
  clinic: ClinicSummary;
  location?: PostLocationSummary | null;
};

/**
 * Companion / listing maps destination.
 * Requires coordinates — city/province alone is too vague for directions.
 */
export function getWorkerPostMapsDestination(
  input: WorkerPostMapsInput,
): MapsDestination | null {
  if (!hasMappableClinicCoordinates(input.clinic)) return null;

  const { displayName, placeLabel } = resolveWorkerPostLocationParts(input);
  const label = [displayName, placeLabel].filter(Boolean).join(', ') || displayName;

  return {
    latitude: input.clinic.latitude,
    longitude: input.clinic.longitude,
    label,
  };
}
