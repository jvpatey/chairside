import type { Conversation } from '@chairside/api';
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

const WORKER_MESSAGES_SUBTITLE =
  'Conversations about your applications, fill-ins, and clinic outreach.';

export type WorkerMessagesInboxPanelProps = {
  compact?: boolean;
  scroll?: boolean;
  fillsContainer?: boolean;
  selectedConversationId?: string | null;
  onConversationSelect?: (conversationId: string) => void;
  onConversationsChange?: (conversations: Conversation[]) => void;
  onMessageClinicPress?: () => void;
  onInboxVisibilityChange?: (state: { isFilteredEmpty: boolean }) => void;
};

export function WorkerMessagesInboxPanel({
  compact = false,
  scroll,
  fillsContainer = false,
  selectedConversationId,
  onConversationSelect,
  onConversationsChange,
  onMessageClinicPress,
  onInboxVisibilityChange,
}: WorkerMessagesInboxPanelProps) {
  const { user } = useAuth();
  const { refreshUnread } = useMessageUnread();
  const [conversations, setConversations] = useState<Awaited<
    ReturnType<typeof listConversationsForWorker>
  >>([]);

  const load = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      onConversationsChange?.([]);
      return;
    }

    try {
      const rows = await listConversationsForWorker(user.id);
      setConversations(rows);
      onConversationsChange?.(rows);
      await refreshUnread();
    } catch {
      setConversations([]);
      onConversationsChange?.([]);
    }
  }, [onConversationsChange, refreshUnread, user?.id]);

  useRefreshOnFocus(load);

  const handleConversationPress = (conversation: Conversation) => {
    if (onConversationSelect) {
      onConversationSelect(conversation.id);
      return;
    }

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
  };

  if (!user?.id) {
    return (
      <Screen
        title="Messages"
        subtitle={WORKER_MESSAGES_SUBTITLE}
        scroll={scroll ?? !compact}
        fillsContainer={fillsContainer}
        animateEntry={false}
      />
    );
  }

  return (
    <Screen
      title="Messages"
      subtitle={WORKER_MESSAGES_SUBTITLE}
      constrainWidth={!compact}
      scroll={scroll ?? !compact}
      fillsContainer={fillsContainer}
      animateEntry={false}
    >
      <ConversationInboxList
        conversations={conversations}
        role="worker"
        userId={user.id}
        avatarKind="clinic"
        compact={compact}
        selectedConversationId={selectedConversationId}
        header={
          <WorkerMessageClinicAction
            onPress={() => {
              if (onMessageClinicPress) {
                onMessageClinicPress();
                return;
              }
              router.push(getWorkerMessageClinicsRoute());
            }}
          />
        }
        filterBesideHeader
        onInboxVisibilityChange={onInboxVisibilityChange}
        onConversationPress={handleConversationPress}
        onConversationHidden={load}
      />
    </Screen>
  );
}
