import { getMissingWorkerProfileFields } from '@chairside/api';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { Alert } from 'react-native';

import { WORKER_SETUP_BASICS } from '@/lib/routing';
import type { WorkerProfile } from '@chairside/api';

export function guardApply(
  workerProfile: WorkerProfile | null,
  isProfileComplete: boolean,
  target: Href,
) {
  if (isProfileComplete) {
    router.push(target);
    return;
  }

  const missing = getMissingWorkerProfileFields(workerProfile);
  Alert.alert(
    'Complete your profile',
    missing.length > 0
      ? `Add the following before applying: ${missing.join(', ')}`
      : 'Finish your profile to apply.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue setup', onPress: () => router.push(WORKER_SETUP_BASICS) },
    ],
  );
}
