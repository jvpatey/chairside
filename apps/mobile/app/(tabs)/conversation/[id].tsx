import { getConversation, type Conversation } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { MessageThreadLoadingShell } from '@/components/messaging/MessageThreadLoadingShell';
import { MessageThread } from '@/components/messaging/MessageThread';
import { WorkerMessagesInboxPanel } from '@/components/messaging/WorkerMessagesInboxPanel';
import { MasterDetailLayout } from '@/components/ui/MasterDetailLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { formatConversationDisplay } from '@/lib/conversationDisplay';
import { navigateAfterMessageThread } from '@/lib/routing';

export default function WorkerConversationScreen() {
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
    navigateAfterMessageThread(router, 'worker');
  }, []);

  const load = useCallback(async () => {
    if (!user?.id || !routeConversationId || routeTitle) {
      return;
    }

    try {
      const row = await getConversation(user.id, 'worker', routeConversationId);
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

  if (routeTitle) {
    const thread = (
      <MessageThread
        userId={user.id}
        role="worker"
        conversationId={routeConversationId}
        title={routeTitle}
        subtitle={routeSubtitle ?? ''}
        onBack={goBack}
        onConversationChange={setConversation}
      />
    );

    if (isTablet) {
      return (
        <MasterDetailLayout
          master={<WorkerMessagesInboxPanel compact />}
          detail={thread}
          showDetail
        />
      );
    }

    return thread;
  }

  if (!conversation) {
    return <MessageThreadLoadingShell onBack={goBack} />;
  }

  const thread = (
    <MessageThread
      userId={user.id}
      role="worker"
      conversationId={conversation.id}
      title={formatConversationDisplay(conversation, 'worker').threadTitle}
      subtitle={formatConversationDisplay(conversation, 'worker').threadSubtitle}
      onBack={goBack}
      onConversationChange={setConversation}
    />
  );

  if (isTablet) {
    return (
      <MasterDetailLayout
        master={<WorkerMessagesInboxPanel compact />}
        detail={thread}
        showDetail
      />
    );
  }

  return thread;
}
