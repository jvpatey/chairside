import type { ClinicProfile, ClinicProfileCompletenessLocation } from '@chairside/api';
import { getMissingClinicProfileFields } from '@chairside/api';
import type { Href } from 'expo-router';
import { Alert, Platform } from 'react-native';

import { getClinicPostingSetupHref } from '@/lib/clinicPostingSetupRouting';

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
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`${message}\n\nContinue setup?`);
      if (confirmed) onNavigate(setupHref);
    }
    return;
  }

  Alert.alert('Complete your clinic profile', message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Continue setup', onPress: () => onNavigate(setupHref) },
  ]);
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
