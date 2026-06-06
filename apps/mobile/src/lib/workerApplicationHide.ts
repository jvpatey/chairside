import {
  canWorkerHideApplication,
  isActiveApplicationStatus,
} from '@chairside/config';
import type { WorkerApplication } from '@chairside/api';
import { hideWorkerApplication } from '@chairside/api';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

import { showConfirmActionSheet } from '@/lib/confirmActionSheet';

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
      ? 'This hides the request from your list. The clinic still has the record.'
      : 'This hides the application from your list. The clinic still has your application on file.',
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
