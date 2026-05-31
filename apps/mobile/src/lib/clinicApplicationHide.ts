import { hideClinicApplication, type ClinicApplication } from '@chairside/api';
import { canClinicHideApplication } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

export function confirmHideClinicApplication(
  clinicId: string,
  application: ClinicApplication,
  onHidden: () => void,
) {
  if (!canClinicHideApplication(application)) return;

  Alert.alert(
    'Remove from list?',
    'This archives the applicant and removes them from your lists. Their record is kept for your files.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
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
          })();
        },
      },
    ],
  );
}
