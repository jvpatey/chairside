import type { ClinicLocation } from './clinicOrganizationTypes';

export function filterLocationsForMembership(
  locations: ClinicLocation[],
  accessibleLocationIds: string[] | 'all',
): ClinicLocation[] {
  if (accessibleLocationIds === 'all') {
    return locations.filter((location) => location.is_active);
  }
  const allowed = new Set(accessibleLocationIds);
  return locations.filter((location) => location.is_active && allowed.has(location.id));
}

export function formatPosterAttribution(input: {
  displayName?: string | null;
  title?: string | null;
}): string | null {
  const name = input.displayName?.trim();
  if (!name) return null;
  const title = input.title?.trim();
  return title ? `${name}, ${title}` : name;
}
