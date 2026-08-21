/** Location fields used to decide whether a group account can finish setup. */
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

function hasClinicContact(profile: ClinicProfileCompletenessProfile): boolean {
  return Boolean(profile.phone?.trim() || profile.contact_name?.trim());
}

export function isClinicLocationRecordComplete(
  location: ClinicProfileCompletenessLocation,
): boolean {
  return (
    Boolean(location.address_line1?.trim()) &&
    Boolean(location.city?.trim()) &&
    Boolean(location.postal_code?.trim()) &&
    (location.software_used?.length ?? 0) > 0
  );
}

function activeLocations(
  locations: ClinicProfileCompletenessLocation[] | undefined,
): ClinicProfileCompletenessLocation[] {
  return (locations ?? []).filter((location) => location.is_active !== false);
}

function hasCompleteGroupLocation(
  locations: ClinicProfileCompletenessLocation[] | undefined,
): boolean {
  return activeLocations(locations).some(isClinicLocationRecordComplete);
}

function shouldUseGroupLocations(
  profile: ClinicProfileCompletenessProfile,
  options?: ClinicProfileCompletenessOptions,
): boolean {
  return profile.account_type === 'group' && activeLocations(options?.locations).length > 0;
}

export function isClinicProfileComplete(
  profile: ClinicProfileCompletenessProfile | null,
  options?: ClinicProfileCompletenessOptions,
): boolean {
  if (!profile) return false;

  const hasContact = hasClinicContact(profile);
  const hasName = Boolean(profile.clinic_name?.trim());
  if (!hasName || !hasContact) return false;

  if (shouldUseGroupLocations(profile, options)) {
    return hasCompleteGroupLocation(options?.locations);
  }

  return (
    Boolean(profile.address_line1?.trim()) &&
    Boolean(profile.city?.trim()) &&
    Boolean(profile.postal_code?.trim()) &&
    (profile.software_used?.length ?? 0) > 0
  );
}

export function getMissingClinicProfileFields(
  profile: ClinicProfileCompletenessProfile | null,
  options?: ClinicProfileCompletenessOptions,
): string[] {
  if (!profile) {
    return [
      'Clinic name',
      'Street address',
      'City',
      'Postal code',
      'Software used',
      'Phone or contact name',
    ];
  }

  const missing: string[] = [];
  if (!profile.clinic_name?.trim()) missing.push('Clinic name');
  if (!hasClinicContact(profile)) missing.push('Phone or contact name');

  if (shouldUseGroupLocations(profile, options)) {
    if (!hasCompleteGroupLocation(options?.locations)) {
      missing.push('A location with address and software');
    }
    return missing;
  }

  if (!profile.address_line1?.trim()) missing.push('Street address');
  if (!profile.city?.trim()) missing.push('City');
  if (!profile.postal_code?.trim()) missing.push('Postal code');
  if ((profile.software_used?.length ?? 0) === 0) missing.push('Software used');
  return missing;
}
