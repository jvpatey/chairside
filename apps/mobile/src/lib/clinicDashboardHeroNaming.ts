/** Resolve clinic dashboard hero naming for individual vs group accounts. */

export type ClinicDashboardHeroNamingInput = {
  isGroup: boolean;
  isProfileComplete: boolean;
  clinicName?: string | null;
  groupName?: string | null;
  memberDisplayName?: string | null;
  memberRoleLabel?: string | null;
  contactName?: string | null;
  locationScope: 'all' | string;
  accessibleLocations: Array<{
    id: string;
    name?: string | null;
    city?: string | null;
    province?: string | null;
  }>;
  clinicCity?: string | null;
  clinicProvince?: string | null;
};

export type ClinicDashboardHeroNaming = {
  greetingName: string | null;
  displayName: string | null;
  namePlaceholder: string;
  subtitle: string;
  identityLine?: string;
};

/**
 * Groups: greeting stays personal; title follows location scope so we don't
 * repeat the person (greeting + title) or the group (title + subtitle).
 * Incomplete setup stays out of the subtitle — the Get Started checklist owns that CTA.
 * Individuals: greeting uses contact first name; title is the clinic name.
 */
export function getClinicDashboardHeroNaming(
  input: ClinicDashboardHeroNamingInput,
): ClinicDashboardHeroNaming {
  if (input.isGroup) {
    const scopedLocation =
      input.locationScope !== 'all'
        ? input.accessibleLocations.find((location) => location.id === input.locationScope) ??
          null
        : null;
    const groupName = input.groupName?.trim() || 'Dental group';
    const locationName = scopedLocation?.name?.trim() || null;
    const locationPlace = [scopedLocation?.city, scopedLocation?.province]
      .filter(Boolean)
      .join(', ');

    return {
      greetingName: getFirstNameToken(input.memberDisplayName),
      displayName: locationName || groupName,
      namePlaceholder: 'Your group',
      subtitle: scopedLocation
        ? locationPlace || 'Clinic location'
        : input.accessibleLocations.length > 1
          ? `${input.accessibleLocations.length} locations`
          : locationPlaceFromFirst(input.accessibleLocations) || 'Dental group',
      identityLine:
        input.isProfileComplete && input.memberRoleLabel
          ? input.memberRoleLabel
          : undefined,
    };
  }

  return {
    greetingName: input.isProfileComplete ? getFirstNameToken(input.contactName) : null,
    displayName: input.isProfileComplete ? input.clinicName?.trim() || null : null,
    namePlaceholder: input.isProfileComplete ? 'Your practice' : 'Welcome to Chairside',
    subtitle: input.isProfileComplete
      ? [input.clinicCity, input.clinicProvince].filter(Boolean).join(', ') || 'Dental practice'
      : 'Dental practice',
  };
}

function getFirstNameToken(fullName?: string | null): string | null {
  const first = fullName?.trim().split(/\s+/).filter(Boolean)[0];
  return first || null;
}

function locationPlaceFromFirst(
  locations: ClinicDashboardHeroNamingInput['accessibleLocations'],
): string {
  const first = locations[0];
  if (!first) return '';
  return [first.city, first.province].filter(Boolean).join(', ');
}
