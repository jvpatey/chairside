import type { ClinicProfile, ClinicProfileCompletenessLocation } from '@chairside/api';
import { getMissingClinicProfileFields } from '@chairside/api';
import type { Href } from 'expo-router';

import {
  getManagerAccessBannerCopy,
  getManagerAccessBlockReason,
} from '@/lib/clinicManagerAccess';
import { getClinicPostingSetupHref } from '@/lib/clinicPostingSetupRouting';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { CLINIC_PROFILE_TEAM } from '@/lib/routing';

type GuardClinicPostingInput = {
  isProfileComplete: boolean;
  clinicProfile: ClinicProfile | null;
  locations: ClinicProfileCompletenessLocation[];
  isGroup: boolean;
  isOwner?: boolean;
  assignedLocationIds?: string[];
  onAllowed: (target: Href) => void;
  target: Href;
};

function showPostingBlockedAlert(
  title: string,
  message: string,
  confirmLabel: string,
  setupHref: Href,
  onNavigate: (href: Href) => void,
) {
  showConfirmActionSheet({
    title,
    message,
    confirmLabel,
    onConfirm: () => onNavigate(setupHref),
  });
}

export function guardClinicPosting({
  isProfileComplete,
  clinicProfile,
  locations,
  isGroup,
  isOwner = true,
  assignedLocationIds = [],
  onAllowed,
  target,
}: GuardClinicPostingInput): void {
  if (isProfileComplete) {
    onAllowed(target);
    return;
  }

  const managerReason = getManagerAccessBlockReason({
    isGroup,
    isOwner,
    clinicProfile,
    locations,
    assignedLocationIds,
  });

  if (managerReason) {
    const copy = getManagerAccessBannerCopy(managerReason);
    if (managerReason === 'no_clinic_assigned') {
      showPostingBlockedAlert(
        copy.title,
        copy.message,
        'View Team & access',
        CLINIC_PROFILE_TEAM,
        onAllowed,
      );
      return;
    }
    showConfirmActionSheet({
      title: copy.title,
      message: copy.message,
      confirmLabel: 'Got it',
      onConfirm: () => undefined,
    });
    return;
  }

  const missing = getMissingClinicProfileFields(clinicProfile, { locations });
  const message =
    missing.length > 0
      ? `Add the following before posting: ${missing.join(', ')}`
      : 'Finish your clinic profile to start posting.';
  const setupHref = getClinicPostingSetupHref(missing, isGroup);

  showPostingBlockedAlert(
    'Complete your clinic profile',
    message,
    'Continue setup',
    setupHref,
    onAllowed,
  );
}
