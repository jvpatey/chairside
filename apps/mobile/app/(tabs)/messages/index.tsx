import { useLocalSearchParams } from 'expo-router';

import { MessageSplitView } from '@/components/messaging/MessageSplitView';
import { WorkerMessagesInboxPanel } from '@/components/messaging/WorkerMessagesInboxPanel';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export default function WorkerMessagesScreen() {
  const { isTablet } = useResponsiveLayout();
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const initialConversationId =
    typeof conversationId === 'string' ? conversationId : undefined;

  if (isTablet) {
    return (
      <MessageSplitView
        role="worker"
        masterView="inbox"
        initialConversationId={initialConversationId}
      />
    );
  }

  return <WorkerMessagesInboxPanel />;
}
