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

export default function WorkerConversationScreen() {
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
  const routeConversationId =
    typeof conversationId === 'string'
      ? conversationId
      : typeof id === 'string'
        ? id
        : '';
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

  if (isTablet) {
    const threadTitle = routeTitle ?? (conversation ? formatConversationDisplay(conversation, 'worker').threadTitle : 'Messages');
    const threadSubtitle =
      routeSubtitle ?? (conversation ? formatConversationDisplay(conversation, 'worker').threadSubtitle : '');

    if (!routeTitle && !conversation) {
      return <MessageThreadLoadingShell onBack={goBack} />;
    }

    return (
      <MessageThreadSplitView
        role="worker"
        conversationId={routeConversationId}
        title={threadTitle}
        subtitle={threadSubtitle}
        scrollToMessageId={routeScrollToMessageId}
        highlightQuery={routeHighlightQuery}
      />
    );
  }

  if (routeTitle) {
    return (
      <MessageThread
        userId={user.id}
        role="worker"
        conversationId={routeConversationId}
        title={routeTitle}
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
    <MessageThread
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
