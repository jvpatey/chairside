import type { Conversation } from '@chairside/api';
import { listConversationsForWorker } from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { ConversationInboxList } from '@/components/messaging/ConversationInboxList';
import { WorkerMessageClinicAction } from '@/components/messaging/WorkerMessageClinicAction';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useInboxRealtime } from '@/hooks/useInboxRealtime';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getMessageThreadPreview } from '@/lib/conversationDisplay';
import { getConversationMessagesRoute, getWorkerMessageClinicsRoute } from '@/lib/routing';
import type { MessageThreadFocus } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

const WORKER_MESSAGES_SUBTITLE =
  'Conversations about your applications, fill-ins, and clinic outreach.';

export type WorkerMessagesInboxPanelProps = {
  compact?: boolean;
  scroll?: boolean;
  fillsContainer?: boolean;
  selectedConversationId?: string | null;
  onConversationSelect?: (conversationId: string, focus?: MessageThreadFocus) => void;
  onConversationsChange?: (conversations: Conversation[]) => void;
  onMessageClinicPress?: () => void;
  onInboxVisibilityChange?: (state: { isFilteredEmpty: boolean }) => void;
};

function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const styles = useThemedStyles(({ spacing }) => ({
    content: {
      gap: spacing.md,
      flex: compact ? 1 : undefined,
      minHeight: compact ? 0 : undefined,
    },
    loadingWrap: {
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
  }));

  const publishConversations = useCallback(
    (rows: Conversation[]) => {
      setConversations(rows);
      onConversationsChange?.(rows);
    },
    [onConversationsChange],
  );

  const load = useCallback(async () => {
    if (!user?.id) {
      publishConversations([]);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    setIsLoading(true);
    try {
      const rows = await listConversationsForWorker(user.id);
      publishConversations(rows);
      setLoadError(null);
      await refreshUnread();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load conversations.');
      publishConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [publishConversations, refreshUnread, user?.id]);

  useRefreshOnFocus(load);

  useInboxRealtime(user?.id, 'worker', (message) => {
    setConversations((current) => {
      const index = current.findIndex((row) => row.id === message.conversation_id);
      if (index === -1) {
        void load();
        return current;
      }

      const next = [...current];
      const row = next[index]!;
      next[index] = {
        ...row,
        last_message_at: message.created_at,
        last_message_preview:
          message.body.length > 120 ? `${message.body.slice(0, 120).trim()}…` : message.body,
        last_sender_id: message.sender_id,
        unread: message.sender_id !== user?.id,
      };
      const sorted = sortConversations(next);
      onConversationsChange?.(sorted);
      return sorted;
    });
    void refreshUnread();
  });

  const handleConversationPress = (conversation: Conversation, focus?: MessageThreadFocus) => {
    if (onConversationSelect) {
      onConversationSelect(conversation.id, focus);
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
          scrollToMessageId: focus?.scrollToMessageId,
          highlightQuery: focus?.highlightQuery,
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
      <View style={styles.content}>
        {loadError ? (
          <DashboardErrorBanner
            message={loadError}
            onRetry={() => {
              void load();
            }}
          />
        ) : null}

        {isLoading && conversations.length === 0 ? (
          compact ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" />
            </View>
          ) : (
            <PageLoadingList message="Loading conversations…" />
          )
        ) : (
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
                  router.push(getWorkerMessageClinicsRoute('messages-tab'));
                }}
              />
            }
            filterBesideHeader
            onInboxVisibilityChange={onInboxVisibilityChange}
            onConversationPress={handleConversationPress}
            onConversationHidden={load}
          />
        )}
      </View>
    </Screen>
  );
}
