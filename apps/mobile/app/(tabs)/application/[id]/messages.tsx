import {
  getConversationByApplicationId,
  type Conversation,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { ApplicationMessageThread } from '@/components/messaging/ApplicationMessageThread';
import { MessageThreadLoadingShell } from '@/components/messaging/MessageThreadLoadingShell';
import { MessageThreadSplitView } from '@/components/messaging/MessageSplitView';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { navigateAfterMessageThread } from '@/lib/routing';
import { formatConversationDisplay } from '@/lib/conversationDisplay';

export default function WorkerApplicationMessagesScreen() {
  const { user } = useAuth();
  const { isTablet } = useResponsiveLayout();
  const { id, conversationId, title, subtitle, scrollToMessageId, highlightQuery } =
    useLocalSearchParams<{
    id?: string;
    conversationId?: string;
    title?: string;
    subtitle?: string;
    scrollToMessageId?: string;
    highlightQuery?: string;
  }>();
  const applicationId = typeof id === 'string' ? id : '';
  const routeConversationId = typeof conversationId === 'string' ? conversationId : undefined;
  const routeTitle = typeof title === 'string' ? title : undefined;
  const routeSubtitle = typeof subtitle === 'string' ? subtitle : undefined;
  const routeScrollToMessageId =
    typeof scrollToMessageId === 'string' ? scrollToMessageId : undefined;
  const routeHighlightQuery = typeof highlightQuery === 'string' ? highlightQuery : undefined;
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const goBack = useCallback(() => {
    navigateAfterMessageThread(router, 'worker');
  }, []);

  const load = useCallback(async () => {
    if (!user?.id || !applicationId || routeConversationId) {
      return;
    }

    try {
      const row = await getConversationByApplicationId(user.id, 'worker', applicationId);
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

  const resolvedConversationId = routeConversationId ?? conversation?.id;
  const threadTitle =
    routeTitle ??
    (conversation ? formatConversationDisplay(conversation, 'worker').threadTitle : 'Messages');
  const threadSubtitle =
    routeSubtitle ??
    (conversation ? formatConversationDisplay(conversation, 'worker').threadSubtitle : '');

  if (isTablet && resolvedConversationId) {
    return (
      <MessageThreadSplitView
        role="worker"
        conversationId={resolvedConversationId}
        title={threadTitle}
        subtitle={threadSubtitle}
        scrollToMessageId={routeScrollToMessageId}
        highlightQuery={routeHighlightQuery}
      />
    );
  }

  if (routeConversationId) {
    return (
      <ApplicationMessageThread
        userId={user.id}
        role="worker"
        conversationId={routeConversationId}
        title={routeTitle ?? 'Messages'}
        subtitle={routeSubtitle ?? ''}
        scrollToMessageId={routeScrollToMessageId}
        highlightQuery={routeHighlightQuery}
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
      role="worker"
      conversationId={conversation.id}
      title={formatConversationDisplay(conversation, 'worker').threadTitle}
      subtitle={formatConversationDisplay(conversation, 'worker').threadSubtitle}
      scrollToMessageId={routeScrollToMessageId}
      highlightQuery={routeHighlightQuery}
      onBack={goBack}
      onConversationChange={setConversation}
    />
  );
}
