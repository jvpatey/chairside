import type { Conversation } from '@chairside/api';
import { hideClinicConversation, hideWorkerConversation } from '@chairside/api';
import * as Haptics from 'expo-haptics';

export function getHideConversationMessage(conversation: Conversation): string {
  const isStandaloneThread =
    conversation.conversation_type === 'general' || conversation.conversation_type === 'outreach';

  return isStandaloneThread
    ? 'This removes the conversation from your inbox. If they message you again, it will reappear.'
    : 'This removes the conversation from your inbox. You can still open it from the application. New messages will bring it back.';
}

export async function hideConversation(
  conversation: Conversation,
  role: 'worker' | 'clinic',
  userId: string,
): Promise<void> {
  if (role === 'worker') {
    await hideWorkerConversation(userId, conversation.id);
  } else {
    await hideClinicConversation(userId, conversation.id);
  }
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
