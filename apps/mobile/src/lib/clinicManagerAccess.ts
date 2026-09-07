import type { ClinicProfile, ClinicProfileCompletenessLocation } from '@chairside/api';
import { isClinicProfileComplete } from '@chairside/api';

export type ManagerAccessBlockReason = 'no_clinic_assigned' | 'owner_setup_incomplete';

type ManagerAccessInput = {
  isGroup: boolean;
  isOwner: boolean;
  clinicProfile: ClinicProfile | null;
  /** Locations visible to this member (RLS-filtered for managers). */
  locations: ClinicProfileCompletenessLocation[];
  /** Assigned clinic ids from membership. Empty means owner must assign access. */
  assignedLocationIds: string[];
};

function isOwnerSetupComplete(
  clinicProfile: ClinicProfile | null,
  locations: ClinicProfileCompletenessLocation[],
): boolean {
  if (!clinicProfile) return false;
  if (clinicProfile.setup_completed_at) return true;
  return isClinicProfileComplete(clinicProfile, { locations });
}

/**
 * Managers are ready when they have ≥1 assigned clinic and the org is set up.
 * Uses setup_completed_at so a finished owner org is not blocked by field quirks
 * on the manager's filtered location list.
 */
export function isClinicMemberReadyToPost(input: ManagerAccessInput): boolean {
  const { isGroup, isOwner, clinicProfile, locations, assignedLocationIds } = input;

  if (!isGroup || isOwner) {
    return isClinicProfileComplete(clinicProfile, { locations });
  }

  if (assignedLocationIds.length === 0) return false;
  return isOwnerSetupComplete(clinicProfile, locations);
}

export function getManagerAccessBlockReason(
  input: ManagerAccessInput,
): ManagerAccessBlockReason | null {
  if (!input.isGroup || input.isOwner) return null;
  if (isClinicMemberReadyToPost(input)) return null;
  if (input.assignedLocationIds.length === 0) return 'no_clinic_assigned';
  return 'owner_setup_incomplete';
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
    title: 'Setup in progress',
    message:
      'Your group owner still needs to finish clinic setup. You will be able to post once that is done.',
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
