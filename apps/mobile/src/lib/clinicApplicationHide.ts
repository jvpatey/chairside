import { hideClinicApplication, type ClinicApplication } from '@chairside/api';
import { canClinicHideApplication } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

import { showConfirmActionSheet } from '@/lib/confirmActionSheet';

export function confirmHideClinicApplication(
  clinicId: string,
  application: ClinicApplication,
  onHidden: () => void,
) {
  if (!canClinicHideApplication(application)) return;

  showConfirmActionSheet({
    title: 'Remove from list?',
    message:
      'This archives the applicant and removes them from your lists. Their record is kept for your files.',
    confirmLabel: 'Remove',
    destructive: true,
    onConfirm: async () => {
      try {
        await hideClinicApplication(clinicId, application.id);
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
