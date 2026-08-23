import type { ClinicSummary, PostLocationSummary } from '@chairside/api';

import { formatClinicPostingLocation, formatClinicPostingPlace } from '@/lib/clinicPostingListDisplay';

type WorkerPostLocationInput = {
  clinic: ClinicSummary;
  location?: PostLocationSummary | null;
};

export type WorkerPostLocationParts = {
  displayName: string;
  placeLabel: string | null;
};

export function resolveWorkerPostLocationParts(
  input: WorkerPostLocationInput,
): WorkerPostLocationParts {
  const placeLabel =
    formatClinicPostingPlace(
      input.location?.city ?? input.clinic.city,
      input.location?.province ?? input.clinic.province,
    ) || null;

  const displayName =
    input.location?.name?.trim() || input.clinic.clinic_name?.trim() || 'Clinic';

  return { displayName, placeLabel };
}

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
    : resolveWorkerPostLocationParts(input).placeLabel;

  if (!locationBase) return distanceLabel ?? null;
  if (distanceLabel) return `${locationBase} • ${distanceLabel}`;
  return locationBase;
}

/** Geographic place only for listing cards (clinic/site name lives in the subtitle). */
export function formatWorkerListingCardLocation(
  input: WorkerPostLocationInput,
  distanceLabel?: string | null,
): string | null {
  const placeLabel = resolveWorkerPostLocationParts(input).placeLabel;
  if (!placeLabel) return distanceLabel?.trim() || null;
  if (distanceLabel?.trim()) return `${placeLabel} • ${distanceLabel.trim()}`;
  return placeLabel;
}
