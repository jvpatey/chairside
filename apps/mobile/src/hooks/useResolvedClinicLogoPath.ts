import type { ClinicLocation, ClinicProfile } from '@chairside/api';

import { useClinicProfile } from '@/contexts/ClinicProfileContext';

/** Prefer a location logo when the posting is tied to that site; otherwise clinic logo. */
export function resolveClinicLogoPath(
  clinicProfile: ClinicProfile | null | undefined,
  locations: ClinicLocation[],
  locationId?: string | null,
): string | null {
  if (locationId) {
    const locationLogo = locations
      .find((location) => location.id === locationId)
      ?.logo_storage_path?.trim();
    if (locationLogo) return locationLogo;
  }

  return clinicProfile?.logo_storage_path?.trim() || null;
}

export function useResolvedClinicLogoPath(locationId?: string | null) {
  const { clinicProfile, locations } = useClinicProfile();
  return resolveClinicLogoPath(clinicProfile, locations, locationId);
}
