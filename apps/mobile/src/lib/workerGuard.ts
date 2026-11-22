import {
  getMissingWorkerProfileFields,
  isWorkerProfileComplete,
  type WorkerProfile,
} from '@chairside/api';
import type { Href } from 'expo-router';
import { router } from 'expo-router';

import { AnalyticsEvents } from '@/lib/analytics/events';
import { captureAnalyticsEvent } from '@/lib/analytics/posthog';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { WORKER_FINISH_PROFILE } from '@/lib/routing';

export function guardApply(
  workerProfile: WorkerProfile | null,
  isProfileComplete: boolean,
  target: Href,
) {
  if (isProfileComplete) {
    const path = String(target);
    captureAnalyticsEvent(AnalyticsEvents.applyStarted, {
      target: path.includes('shift') ? 'shift' : path.includes('job') ? 'job' : 'unknown',
    });
    router.push(target);
    return;
  }

  const missing = getMissingWorkerProfileFields(workerProfile);
  showConfirmActionSheet({
    title: 'A few details first',
    message:
      missing.length > 0
        ? `Add the following to request cover: ${missing.join(', ')}`
        : 'Add your role, phone, and city to request cover.',
    confirmLabel: 'Continue',
    onConfirm: () => router.push(WORKER_FINISH_PROFILE),
  });
}

export function guardQuickApply(workerProfile: WorkerProfile | null, _kitRoute: Href) {
  if (isWorkerProfileComplete(workerProfile)) {
    return true;
  }

  const missing = getMissingWorkerProfileFields(workerProfile);
  showConfirmActionSheet({
    title: 'A few details first',
    message:
      missing.length > 0
        ? `Add the following to continue: ${missing.join(', ')}`
        : 'Add your role, phone, and city to continue.',
    confirmLabel: 'Continue',
    onConfirm: () => router.push(WORKER_FINISH_PROFILE),
  });
  return false;
}
