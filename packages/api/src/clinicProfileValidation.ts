/** Location fields used for multi-site completeness (address on a clinic_locations row). */
export type ClinicProfileCompletenessLocation = {
  is_active?: boolean | null;
  address_line1?: string | null;
  city?: string | null;
  postal_code?: string | null;
  software_used?: string[] | null;
};

export type ClinicProfileCompletenessProfile = {
  account_type?: 'individual' | 'group' | null;
  clinic_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  city?: string | null;
  postal_code?: string | null;
  software_used?: string[] | null;
};

export type ClinicProfileCompletenessOptions = {
  locations?: ClinicProfileCompletenessLocation[];
};

export function isClinicLocationRecordComplete(
  location: ClinicProfileCompletenessLocation,
): boolean {
  return (
    Boolean(location.address_line1?.trim()) &&
    Boolean(location.city?.trim()) &&
    Boolean(location.postal_code?.trim())
  );
}

function activeLocations(
  locations: ClinicProfileCompletenessLocation[] | undefined,
): ClinicProfileCompletenessLocation[] {
  return (locations ?? []).filter((location) => location.is_active !== false);
}

function hasCompleteLocationAddress(
  profile: ClinicProfileCompletenessProfile,
  locations: ClinicProfileCompletenessLocation[] | undefined,
): boolean {
  if (
    Boolean(profile.address_line1?.trim()) &&
    Boolean(profile.city?.trim()) &&
    Boolean(profile.postal_code?.trim())
  ) {
    return true;
  }
  return activeLocations(locations).some(isClinicLocationRecordComplete);
}

/**
 * Ready to post fill-ins: clinic name + phone + one complete physical address
 * (profile mirror or any active clinic_locations row). Contact/manager name is never required.
 */
export function isClinicProfileComplete(
  profile: ClinicProfileCompletenessProfile | null,
  options?: ClinicProfileCompletenessOptions,
): boolean {
  if (!profile) return false;

  if (!profile.clinic_name?.trim()) return false;
  if (!profile.phone?.trim()) return false;
  return hasCompleteLocationAddress(profile, options?.locations);
}

export function getMissingClinicProfileFields(
  profile: ClinicProfileCompletenessProfile | null,
  options?: ClinicProfileCompletenessOptions,
): string[] {
  if (!profile) {
    return ['Clinic name', 'Phone', 'Street address', 'City', 'Postal code'];
  }

  const missing: string[] = [];
  if (!profile.clinic_name?.trim()) missing.push('Clinic name');
  if (!profile.phone?.trim()) missing.push('Phone');

  if (!hasCompleteLocationAddress(profile, options?.locations)) {
    const active = activeLocations(options?.locations);
    if (active.length > 0) {
      missing.push('A location with a complete address');
    } else {
      if (!profile.address_line1?.trim()) missing.push('Street address');
      if (!profile.city?.trim()) missing.push('City');
      if (!profile.postal_code?.trim()) missing.push('Postal code');
    }
  }

  return missing;
}
