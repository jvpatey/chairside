import {
  canWorkerHideApplication,
  isActiveApplicationStatus,
} from '@chairside/config';
import type { WorkerApplication } from '@chairside/api';
import { hideWorkerApplication } from '@chairside/api';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

import { showConfirmActionSheet } from '@/lib/confirmActionSheet';

export type ApplicationsTabMode = 'active' | 'past';

export const APPLICATIONS_TAB_MODE_OPTIONS: { value: ApplicationsTabMode; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'past', label: 'Past' },
];

export function partitionWorkerApplications(applications: WorkerApplication[]): {
  active: WorkerApplication[];
  past: WorkerApplication[];
} {
  const active: WorkerApplication[] = [];
  const past: WorkerApplication[] = [];

  for (const application of applications) {
    if (
      isActiveApplicationStatus(application.status) &&
      application.post_status !== 'filled' &&
      application.post_status !== 'closed'
    ) {
      active.push(application);
    } else {
      past.push(application);
    }
  }

  return { active, past };
}

export function confirmHideWorkerApplication(
  application: WorkerApplication,
  onHidden: () => void,
) {
  if (!canWorkerHideApplication(application)) return;

  const isShift = application.post_type === 'shift';

  showConfirmActionSheet({
    title: isShift ? 'Remove from list?' : 'Remove application?',
    message: isShift
      ? 'This removes the request from your list. The clinic still has the record.'
      : 'This removes the application from your list. The clinic still has your application on file.',
    confirmLabel: 'Remove',
    destructive: true,
    onConfirm: async () => {
      try {
        await hideWorkerApplication(application.worker_id, application.id);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onHidden();
      } catch (error) {
        Alert.alert(
          'Could not remove',
          error instanceof Error ? error.message : 'Please try again.',
        );
      }
    },
  });
}

export async function clearPastWorkerApplications(
  applications: WorkerApplication[],
): Promise<{ cleared: number; failed: number; skipped: number }> {
  const hideable = applications.filter(canWorkerHideApplication);
  const skipped = applications.length - hideable.length;

  if (hideable.length === 0) {
    return { cleared: 0, failed: 0, skipped };
  }

  const results = await Promise.allSettled(
    hideable.map((application) =>
      hideWorkerApplication(application.worker_id, application.id),
    ),
  );

  const cleared = results.filter((result) => result.status === 'fulfilled').length;
  const failed = hideable.length - cleared;

  return { cleared, failed, skipped };
}

/** @deprecated Use `clearPastWorkerApplications`. */
export const clearPastWorkerFillIns = clearPastWorkerApplications;

function confirmClearPastWorkerApplicationsInternal(
  applications: WorkerApplication[],
  onCleared: () => void,
  copy: {
    title: string;
    buildMessage: (hideableCount: number, skippedCount: number) => string;
    emptyAlert: string;
    partialAlert: (cleared: number, failed: number) => string;
  },
) {
  const hideable = applications.filter(canWorkerHideApplication);
  if (hideable.length === 0) return;

  const skippedCount = applications.length - hideable.length;

  showConfirmActionSheet({
    title: copy.title,
    message: copy.buildMessage(hideable.length, skippedCount),
    confirmLabel: 'Clear all',
    destructive: true,
    onConfirm: async () => {
      try {
        const { cleared, failed } = await clearPastWorkerApplications(applications);
        if (cleared === 0) {
          Alert.alert('Could not clear', copy.emptyAlert);
          return;
        }
        if (failed > 0) {
          Alert.alert('Partially cleared', copy.partialAlert(cleared, failed));
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onCleared();
      } catch (error) {
        Alert.alert(
          'Could not clear',
          error instanceof Error ? error.message : 'Please try again.',
        );
      }
    },
  });
}

export function confirmClearPastWorkerApplications(
  applications: WorkerApplication[],
  onCleared: () => void,
) {
  confirmClearPastWorkerApplicationsInternal(applications, onCleared, {
    title: 'Clear all past applications?',
    buildMessage: (hideableCount) =>
      `This removes ${hideableCount} past application${hideableCount === 1 ? '' : 's'} from your list. Clinic records are unchanged.`,
    emptyAlert: 'None of these past applications could be removed.',
    partialAlert: (cleared, failed) =>
      `${cleared} past application${cleared === 1 ? '' : 's'} removed. ${failed} could not be removed.`,
  });
}

export function confirmClearPastWorkerFillIns(
  applications: WorkerApplication[],
  onCleared: () => void,
) {
  confirmClearPastWorkerApplicationsInternal(applications, onCleared, {
    title: 'Clear all past fill-ins?',
    buildMessage: (hideableCount, skippedCount) =>
      skippedCount > 0
        ? `This removes ${hideableCount} past fill-in${hideableCount === 1 ? '' : 's'} from your list. ${skippedCount} active request${skippedCount === 1 ? '' : 's'} will stay. Clinic records are unchanged.`
        : `This removes ${hideableCount} past fill-in${hideableCount === 1 ? '' : 's'} from your list. Clinic records are unchanged.`,
    emptyAlert: 'None of these past fill-ins could be removed.',
    partialAlert: (cleared, failed) =>
      `${cleared} past fill-in${cleared === 1 ? '' : 's'} removed. ${failed} could not be removed.`,
  });
}
