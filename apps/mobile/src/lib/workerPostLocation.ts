import type { ClinicSummary, PostLocationSummary } from '@chairside/api';

import { formatClinicPostingLocation } from '@/lib/clinicPostingListDisplay';

type WorkerPostLocationInput = {
  clinic: ClinicSummary;
  location?: PostLocationSummary | null;
};

export function resolveWorkerPostLogoStoragePath(input: WorkerPostLocationInput): string | null {
  return input.location?.logo_storage_path ?? input.clinic.logo_storage_path ?? null;
}

export function formatWorkerPostLocation(
  input: WorkerPostLocationInput,
  distanceLabel?: string | null,
): string | null {
  const locationBase = input.location
    ? formatClinicPostingLocation(
        input.location.name,
        input.location.city,
        input.location.province,
      )
    : [input.clinic.city, input.clinic.province].filter(Boolean).join(', ');

  if (!locationBase) return distanceLabel ?? null;
  if (distanceLabel) return `${locationBase} • ${distanceLabel}`;
  return locationBase;
}
