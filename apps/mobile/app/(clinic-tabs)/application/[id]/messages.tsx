import {
  getConversationByApplicationId,
  type Conversation,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { ApplicationMessageThread } from '@/components/messaging/ApplicationMessageThread';
import { MessageThreadLoadingShell } from '@/components/messaging/MessageThreadLoadingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { navigateAfterMessageThread } from '@/lib/routing';

export default function ClinicApplicationMessagesScreen() {
  const { user } = useAuth();
  const { id, conversationId, title, subtitle } = useLocalSearchParams<{
    id?: string;
    conversationId?: string;
    title?: string;
    subtitle?: string;
  }>();
  const applicationId = typeof id === 'string' ? id : '';
  const routeConversationId = typeof conversationId === 'string' ? conversationId : undefined;
  const routeTitle = typeof title === 'string' ? title : undefined;
  const routeSubtitle = typeof subtitle === 'string' ? subtitle : undefined;
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const goBack = useCallback(() => {
    navigateAfterMessageThread(router, 'clinic');
  }, []);

  const load = useCallback(async () => {
    if (!user?.id || !applicationId || routeConversationId) {
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
  }, [applicationId, goBack, routeConversationId, user?.id]);

  useRefreshOnFocus(load);

  if (!user?.id) {
    return <MessageThreadLoadingShell onBack={goBack} />;
  }

  if (routeConversationId) {
    return (
      <ApplicationMessageThread
        userId={user.id}
        role="clinic"
        conversationId={routeConversationId}
        title={routeTitle ?? 'Messages'}
        subtitle={routeSubtitle ?? ''}
        onBack={goBack}
        onConversationChange={setConversation}
      />
    );
  }

  if (!conversation) {
    return <MessageThreadLoadingShell onBack={goBack} />;
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
