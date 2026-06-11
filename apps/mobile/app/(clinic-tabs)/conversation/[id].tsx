import { getConversation, type Conversation } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { MessageThreadLoadingShell } from '@/components/messaging/MessageThreadLoadingShell';
import { MessageThread } from '@/components/messaging/MessageThread';
import { MessageThreadSplitView } from '@/components/messaging/MessageSplitView';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { formatConversationDisplay } from '@/lib/conversationDisplay';
import { navigateAfterMessageThread } from '@/lib/routing';

export default function ClinicConversationScreen() {
  const { user } = useAuth();
  const { isTablet } = useResponsiveLayout();
  const { id, conversationId, title, subtitle } = useLocalSearchParams<{
    id?: string;
    conversationId?: string;
    title?: string;
    subtitle?: string;
  }>();
  const routeConversationId =
    typeof conversationId === 'string'
      ? conversationId
      : typeof id === 'string'
        ? id
        : '';
  const routeTitle = typeof title === 'string' ? title : undefined;
  const routeSubtitle = typeof subtitle === 'string' ? subtitle : undefined;
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const goBack = useCallback(() => {
    navigateAfterMessageThread(router, 'clinic');
  }, []);

  const load = useCallback(async () => {
    if (!user?.id || !routeConversationId || routeTitle) {
      return;
    }

    try {
      const row = await getConversation(user.id, 'clinic', routeConversationId);
      if (!row) {
        Alert.alert('Conversation not found', 'This thread may have been removed.');
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
  }, [goBack, routeConversationId, routeTitle, user?.id]);

  useRefreshOnFocus(load);

  if (!user?.id || !routeConversationId) {
    return <MessageThreadLoadingShell onBack={goBack} />;
  }

  if (isTablet) {
    const threadTitle = routeTitle ?? (conversation ? formatConversationDisplay(conversation, 'clinic').threadTitle : 'Messages');
    const threadSubtitle =
      routeSubtitle ?? (conversation ? formatConversationDisplay(conversation, 'clinic').threadSubtitle : '');

    if (!routeTitle && !conversation) {
      return <MessageThreadLoadingShell onBack={goBack} />;
    }

    return (
      <MessageThreadSplitView
        role="clinic"
        conversationId={routeConversationId}
        title={threadTitle}
        subtitle={threadSubtitle}
      />
    );
  }

  if (routeTitle) {
    return (
      <MessageThread
        userId={user.id}
        role="clinic"
        conversationId={routeConversationId}
        title={routeTitle}
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
    <MessageThread
      userId={user.id}
      role="clinic"
      conversationId={conversation.id}
      title={formatConversationDisplay(conversation, 'clinic').threadTitle}
      subtitle={formatConversationDisplay(conversation, 'clinic').threadSubtitle}
      onBack={goBack}
      onConversationChange={setConversation}
    />
  );
}
