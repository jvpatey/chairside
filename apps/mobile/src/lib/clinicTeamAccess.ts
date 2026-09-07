import type { ClinicMembershipRole } from '@chairside/api';

export const OWNER_ACCESS_ITEMS = [
  'Full access to every location',
  'Billing, plans, and team invitations',
  'Post and manage roles and fill-ins across the group',
  'Edit group profile, locations, and settings',
] as const;

export const MANAGER_ACCESS_ITEMS = [
  'Access only the clinics assigned below',
  'Post and manage roles and fill-ins for those clinics',
  'Review applications and message candidates there',
  'Cannot change billing, group profile, or invite managers',
] as const;

export function formatTeamMemberSubtitle(input: {
  role: ClinicMembershipRole | 'pending';
  title?: string | null;
  locationNames?: string[];
}): string {
  if (input.role === 'pending') {
    const locations =
      input.locationNames && input.locationNames.length > 0
        ? input.locationNames.join(', ')
        : 'Locations TBD';
    return `Invite pending · ${locations}`;
  }

  if (input.role === 'owner') {
    return 'Owner · Full access to all locations';
  }

  const title = input.title?.trim() || 'Manager';
  const locations =
    input.locationNames && input.locationNames.length > 0
      ? input.locationNames.join(', ')
      : 'No clinics assigned';
  return `${title} · ${locations}`;
}
