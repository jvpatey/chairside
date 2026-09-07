import type { ClinicProfile, ClinicProfileCompletenessLocation } from '@chairside/api';
import { isClinicProfileComplete } from '@chairside/api';

export type ManagerAccessBlockReason = 'no_clinic_assigned';

type ManagerAccessInput = {
  isGroup: boolean;
  isOwner: boolean;
  clinicProfile: ClinicProfile | null;
  /** Locations visible to this member (RLS-filtered for managers). */
  locations: ClinicProfileCompletenessLocation[];
  /** Assigned clinic ids from membership. Empty means owner must assign access. */
  assignedLocationIds: string[];
};

function managerHasClinicAccess(input: ManagerAccessInput): boolean {
  if (input.assignedLocationIds.length > 0) return true;
  return input.locations.some((location) => location.is_active !== false);
}

/**
 * Managers are ready once they have clinic access from their invite.
 * Location address/software is an owner concern — not a manager posting gate.
 */
export function isClinicMemberReadyToPost(input: ManagerAccessInput): boolean {
  const { isGroup, isOwner, clinicProfile, locations } = input;

  if (!isGroup || isOwner) {
    return isClinicProfileComplete(clinicProfile, { locations });
  }

  return managerHasClinicAccess(input);
}

export function getManagerAccessBlockReason(
  input: ManagerAccessInput,
): ManagerAccessBlockReason | null {
  if (!input.isGroup || input.isOwner) return null;
  if (isClinicMemberReadyToPost(input)) return null;
  return 'no_clinic_assigned';
}

export function getManagerAccessBannerCopy(reason: ManagerAccessBlockReason): {
  title: string;
  message: string;
} {
  if (reason === 'no_clinic_assigned') {
    return {
      title: 'Waiting for clinic access',
      message:
        'Ask your group owner to assign you a clinic in Team & access. Then you can post roles and fill-ins.',
    };
  }
  return {
    title: 'Waiting for clinic access',
    message:
      'Ask your group owner to assign you a clinic in Team & access. Then you can post roles and fill-ins.',
  };
}

export function getOwnerUnassignedManagersCopy(count: number): {
  title: string;
  message: string;
} {
  return {
    title: 'Assign clinic access',
    message:
      count === 1
        ? 'A manager joined without a clinic. Assign them a location in Team & access so they can post.'
        : `${count} managers joined without a clinic. Assign locations in Team & access so they can post.`,
  };
}
