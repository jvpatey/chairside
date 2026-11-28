import type { ClinicProfile, ClinicProfileCompletenessLocation } from '@chairside/api';
import { getMissingClinicProfileFields } from '@chairside/api';
import type { Href } from 'expo-router';

import { getClinicMissingDetails, type ClinicMissingDetail } from '@/lib/clinicProfileMissingCopy';
import { getClinicPostingSetupHref } from '@/lib/clinicPostingSetupRouting';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';

type GuardClinicMemberAccessInput = {
  isProfileComplete: boolean;
  clinicProfile: ClinicProfile | null;
  locations: ClinicProfileCompletenessLocation[];
  isGroup: boolean;
  /** Incomplete-profile copy shown before the user is sent to setup. */
  ownerTitle?: string;
  ownerMessage?: string;
  onNavigate: (href: Href) => void;
};

type GuardClinicPostingInput = Omit<GuardClinicMemberAccessInput, 'onNavigate' | 'ownerTitle' | 'ownerMessage'> & {
  onAllowed: (target: Href) => void;
  target: Href;
};

function showPostingBlockedAlert(
  title: string,
  message: string,
  confirmLabel: string,
  setupHref: Href,
  onNavigate: (href: Href) => void,
  details?: ClinicMissingDetail[],
) {
  showConfirmActionSheet({
    title,
    message,
    details,
    confirmLabel,
    onConfirm: () => onNavigate(setupHref),
  });
}

/**
 * Shared incomplete-profile sheet for posting, outreach, and open inquiries.
 */
export function guardClinicMemberAccess({
  isProfileComplete,
  clinicProfile,
  locations,
  isGroup,
  ownerTitle = 'A few details first',
  ownerMessage = 'Add your clinic name, phone, and address to post fill-ins.',
  onNavigate,
}: GuardClinicMemberAccessInput): boolean {
  if (isProfileComplete) return true;

  const missing = getMissingClinicProfileFields(clinicProfile, { locations });
  const setupHref = getClinicPostingSetupHref(missing, isGroup);

  if (missing.length > 0) {
    showPostingBlockedAlert(
      ownerTitle,
      'Add these details first. Professionals use them to find and reach your clinic.',
      'Finish profile',
      setupHref,
      onNavigate,
      getClinicMissingDetails(missing),
    );
    return false;
  }

  showPostingBlockedAlert(ownerTitle, ownerMessage, 'Continue', setupHref, onNavigate);
  return false;
}

export function guardClinicPosting({
  isProfileComplete,
  clinicProfile,
  locations,
  isGroup,
  onAllowed,
  target,
}: GuardClinicPostingInput): void {
  const allowed = guardClinicMemberAccess({
    isProfileComplete,
    clinicProfile,
    locations,
    isGroup,
    ownerTitle: 'Complete your clinic profile',
    ownerMessage: 'Finish your clinic profile to start posting.',
    onNavigate: onAllowed,
  });
  if (allowed) onAllowed(target);
}
