/** Resolve clinic dashboard hero naming for individual vs group accounts. */

export type ClinicDashboardHeroNamingInput = {
  isGroup: boolean;
  isProfileComplete: boolean;
  clinicName?: string | null;
  groupName?: string | null;
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
};

/**
 * Groups: the group name is always the title; the location pill below it (rendered
 * by the dashboard) shows which clinic is selected, so the subtitle only carries that
 * clinic's place — never the group or clinic name again.
 * Incomplete setup stays out of the subtitle — the Get Started checklist owns that CTA.
 * Individuals: greeting uses contact first name; title is the clinic name.
 */
export function getClinicDashboardHeroNaming(
  input: ClinicDashboardHeroNamingInput,
): ClinicDashboardHeroNaming {
  if (input.isGroup) {
    const selectedLocation =
      input.accessibleLocations.find((location) => location.id === input.locationScope) ??
      input.accessibleLocations[0] ??
      null;
    const place = [selectedLocation?.city, selectedLocation?.province].filter(Boolean).join(', ');

    return {
      // Groups have no personal name: the group/clinic name is the identity.
      greetingName: null,
      displayName: input.groupName?.trim() || 'Dental group',
      namePlaceholder: 'Your group',
      subtitle: place || 'Dental group',
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
