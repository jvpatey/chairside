import type { Conversation } from '@chairside/api';
import { hideClinicConversation, hideWorkerConversation } from '@chairside/api';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

export function confirmHideConversation(
  conversation: Conversation,
  role: 'worker' | 'clinic',
  userId: string,
  onHidden: () => void,
) {
  const isGeneral = conversation.conversation_type === 'general';

  Alert.alert(
    'Delete conversation?',
    isGeneral
      ? 'This removes the conversation from your inbox. If they message you again, it will reappear.'
      : 'This removes the conversation from your inbox. You can still open it from the application. New messages will bring it back.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              if (role === 'worker') {
                await hideWorkerConversation(userId, conversation.id);
              } else {
                await hideClinicConversation(userId, conversation.id);
              }
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onHidden();
            } catch (error) {
              Alert.alert(
                'Could not delete',
                error instanceof Error ? error.message : 'Please try again.',
              );
            }
          })();
        },
      },
    ],
  );
}
