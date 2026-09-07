import type { ClinicProfile, ClinicProfileCompletenessLocation } from '@chairside/api';
import { getMissingClinicProfileFields } from '@chairside/api';
import type { Href } from 'expo-router';

import { getClinicPostingSetupHref } from '@/lib/clinicPostingSetupRouting';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';

type GuardClinicPostingInput = {
  isProfileComplete: boolean;
  clinicProfile: ClinicProfile | null;
  locations: ClinicProfileCompletenessLocation[];
  isGroup: boolean;
  onAllowed: (target: Href) => void;
  target: Href;
};

function showPostingBlockedAlert(
  message: string,
  setupHref: Href,
  onNavigate: (href: Href) => void,
) {
  showConfirmActionSheet({
    title: 'Complete your clinic profile',
    message,
    confirmLabel: 'Continue setup',
    onConfirm: () => onNavigate(setupHref),
  });
}

export function guardClinicPosting({
  isProfileComplete,
  clinicProfile,
  locations,
  isGroup,
  onAllowed,
  target,
}: GuardClinicPostingInput): void {
  if (isProfileComplete) {
    onAllowed(target);
    return;
  }

  const missing = getMissingClinicProfileFields(clinicProfile, { locations });
  const message =
    missing.length > 0
      ? `Add the following before posting: ${missing.join(', ')}`
      : 'Finish your clinic profile to start posting.';
  const setupHref = getClinicPostingSetupHref(missing, isGroup);

  showPostingBlockedAlert(message, setupHref, onAllowed);
}
