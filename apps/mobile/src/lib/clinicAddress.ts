import type { PublicClinicProfile } from '@chairside/api';
import { getProvinceLabel } from '@chairside/config';

export type PublicClinicAddressFields = Pick<
  PublicClinicProfile,
  'address_line1' | 'address_line2' | 'city' | 'province' | 'postal_code'
>;

export function formatPublicClinicAddress(profile: PublicClinicAddressFields): string | null {
  const cityLine = [
    profile.city?.trim(),
    profile.province ? getProvinceLabel(profile.province) : null,
    profile.postal_code?.trim(),
  ]
    .filter(Boolean)
    .join(', ');

  const parts = [profile.address_line1?.trim(), profile.address_line2?.trim(), cityLine].filter(
    Boolean,
  );

  return parts.length > 0 ? parts.join('\n') : null;
}

export function formatPublicClinicAddressLine(profile: PublicClinicAddressFields): string | null {
  const formatted = formatPublicClinicAddress(profile);
  if (!formatted) return null;
  return formatted.replace(/\n/g, ', ');
}

export function hasMappablePublicClinicCoordinates(
  profile: Pick<PublicClinicProfile, 'latitude' | 'longitude'>,
): profile is PublicClinicProfile & { latitude: number; longitude: number } {
  return profile.latitude != null && profile.longitude != null;
}
