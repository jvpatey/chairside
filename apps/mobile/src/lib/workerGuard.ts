import {
  getMissingWorkerProfileFields,
  isWorkerProfileComplete,
  type WorkerProfile,
} from '@chairside/api';
import type { Href } from 'expo-router';
import { router } from 'expo-router';

import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { WORKER_SETUP_BASICS } from '@/lib/routing';

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
  showConfirmActionSheet({
    title: 'Complete your profile',
    message:
      missing.length > 0
        ? `Add the following before applying: ${missing.join(', ')}`
        : 'Finish your profile to apply.',
    confirmLabel: 'Continue setup',
    onConfirm: () => router.push(WORKER_SETUP_BASICS),
  });
}

export function guardQuickApply(workerProfile: WorkerProfile | null, _kitRoute: Href) {
  if (isWorkerProfileComplete(workerProfile)) {
    return true;
  }

  const missing = getMissingWorkerProfileFields(workerProfile);
  showConfirmActionSheet({
    title: 'Complete your background',
    message:
      missing.length > 0
        ? `Add the following before applying: ${missing.join(', ')}`
        : 'Finish your professional background to apply.',
    confirmLabel: 'Add background',
    onConfirm: () => router.push(WORKER_SETUP_BASICS),
  });
  return false;
}
