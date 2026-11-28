import { formatPostedDateLabel } from '@/lib/dates';

import { useClinicProfile } from '@/contexts/ClinicProfileContext';

/** Resolve the organization clinic id and group identity for the signed-in account. */
export function useClinicActingContext() {
  const {
    clinicId,
    membership,
    isGroup,
    isOwner,
    accessibleLocations,
    scopedLocationIds,
    locationScope,
    setLocationScope,
    organization,
    clinicProfile,
  } = useClinicProfile();

  // Clinic identity is the group/clinic name.
  const groupDisplayName = isGroup
    ? organization?.name?.trim() || clinicProfile?.clinic_name?.trim() || 'Dental group'
    : '';
  return {
    clinicId,
    membership,
    isGroup,
    isOwner,
    accessibleLocations,
    scopedLocationIds,
    locationScope,
    setLocationScope,
    groupDisplayName,
  };
}

/** "Mar 3" style posted-on label for a post's created_at. */
export function resolvePostedOnLabel(postedAt?: string | null): string | null {
  if (!postedAt) return null;
  return formatPostedDateLabel(postedAt).replace(/^Posted\s+/i, '') || null;
}
