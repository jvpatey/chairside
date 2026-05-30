import {
  getConversationByApplicationId,
  type Conversation,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { ApplicationMessageThread } from '@/components/messaging/ApplicationMessageThread';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { navigateAfterMessageThread } from '@/lib/routing';

export default function ClinicApplicationMessagesScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const applicationId = typeof id === 'string' ? id : '';
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const goBack = useCallback(() => {
    navigateAfterMessageThread(router, 'clinic');
  }, []);

  const load = useCallback(async () => {
    if (!user?.id || !applicationId) {
      setConversation(null);
      return;
    }

    try {
      const row = await getConversationByApplicationId(user.id, 'clinic', applicationId);
      if (!row) {
        Alert.alert('Conversation not found', 'Messaging is not available for this application.');
        goBack();
        return;
      }
      setConversation(row);
    } catch (error) {
      Alert.alert(
        'Could not load conversation',
        error instanceof Error ? error.message : 'Please try again.',
      );
      goBack();
    }
  }, [applicationId, goBack, user?.id]);

  useRefreshOnFocus(load);

  if (!user?.id || !conversation) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <ApplicationMessageThread
      userId={user.id}
      role="clinic"
      conversationId={conversation.id}
      title={conversation.counterpart_name}
      subtitle={conversation.post_title}
      onBack={goBack}
      onConversationChange={setConversation}
    />
  );
}
