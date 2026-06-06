import { listConversationsForWorker } from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { ConversationInboxList } from '@/components/messaging/ConversationInboxList';
import { WorkerMessageClinicAction } from '@/components/messaging/WorkerMessageClinicAction';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getMessageThreadPreview } from '@/lib/conversationDisplay';
import { getConversationMessagesRoute, getWorkerMessageClinicsRoute } from '@/lib/routing';

type WorkerMessagesInboxPanelProps = {
  compact?: boolean;
};

export function WorkerMessagesInboxPanel({
  compact = false,
}: WorkerMessagesInboxPanelProps) {
  const { user } = useAuth();
  const { refreshUnread } = useMessageUnread();
  const [conversations, setConversations] = useState<Awaited<
    ReturnType<typeof listConversationsForWorker>
  >>([]);

  const load = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      return;
    }

    try {
      const rows = await listConversationsForWorker(user.id);
      setConversations(rows);
      await refreshUnread();
    } catch {
      setConversations([]);
    }
  }, [refreshUnread, user?.id]);

  useRefreshOnFocus(load);

  if (!user?.id) {
    return (
      <Screen
        title={compact ? undefined : 'Messages'}
        subtitle={
          compact
            ? undefined
            : 'Conversations about your applications, fill-ins, and clinic outreach.'
        }
        showHeader={!compact}
      />
    );
  }

  return (
    <Screen
      title={compact ? undefined : 'Messages'}
      subtitle={
        compact
          ? undefined
          : 'Conversations about your applications, fill-ins, and clinic outreach.'
      }
      showHeader={!compact}
      constrainWidth={!compact}>
      <ConversationInboxList
        conversations={conversations}
        role="worker"
        userId={user.id}
        avatarKind="clinic"
        header={
          compact ? undefined : (
            <WorkerMessageClinicAction onPress={() => router.push(getWorkerMessageClinicsRoute())} />
          )
        }
        filterBesideHeader={!compact}
        onConversationPress={(conversation) => {
          const preview = getMessageThreadPreview(conversation, 'worker');
          router.push(
            getConversationMessagesRoute(
              conversation,
              'worker',
              {
                conversationId: conversation.id,
                ...preview,
              },
              'messages-tab',
            ),
          );
        }}
        onConversationHidden={load}
      />
    </Screen>
  );
}
