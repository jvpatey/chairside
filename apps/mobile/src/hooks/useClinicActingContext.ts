import type { ClinicMembershipRole } from '@chairside/api';
import { formatPostedDateLabel } from '@/lib/dates';

import { useClinicProfile } from '@/contexts/ClinicProfileContext';

/** Access-role label for chrome identity (not job title). */
export function getClinicMembershipRoleLabel(
  role?: ClinicMembershipRole | null,
  isOwner?: boolean,
): 'Owner' | 'Manager' {
  if (role === 'owner' || isOwner) return 'Owner';
  return 'Manager';
}

/** Resolve the organization clinic id and group identity for the signed-in member. */
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

  // Account name (captured at sign-up). Clinic identity is the group/clinic name.
  const memberRoleLabel = isGroup
    ? getClinicMembershipRoleLabel(membership?.role, isOwner)
    : '';
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
    memberRoleLabel,
    groupDisplayName,
  };
}

/** "Mar 3" style posted-on label for a post's created_at. */
export function resolvePostedOnLabel(postedAt?: string | null): string | null {
  if (!postedAt) return null;
  return formatPostedDateLabel(postedAt).replace(/^Posted\s+/i, '') || null;
}
