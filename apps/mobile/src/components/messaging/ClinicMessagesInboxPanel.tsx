import type { Conversation } from '@chairside/api';
import { listConversationsForClinic } from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { ClinicMessagingPreferences } from '@/components/clinic/ClinicMessagingPreferences';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { ConversationInboxList } from '@/components/messaging/ConversationInboxList';
import { MessagingInboxSkeleton } from '@/components/messaging/MessagingSkeleton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useInboxConversationRealtime } from '@/hooks/useConversationRealtime';
import { useInboxRealtime } from '@/hooks/useInboxRealtime';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { patchConversationFromRealtimeUpdate } from '@/lib/conversationRealtime';
import { getMessageThreadPreview } from '@/lib/conversationDisplay';
import { getConversationMessagesRoute } from '@/lib/routing';
import type { MessageThreadFocus } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

const CLINIC_MESSAGES_SUBTITLE =
  'Conversations with applicants about roles, fill-ins, and general inquiries.';

type ClinicMessagesInboxPanelProps = {
  compact?: boolean;
  scroll?: boolean;
  fillsContainer?: boolean;
  selectedConversationId?: string | null;
  onConversationSelect?: (conversationId: string, focus?: MessageThreadFocus) => void;
  onConversationsChange?: (conversations: Conversation[]) => void;
  onInboxVisibilityChange?: (state: { isFilteredEmpty: boolean }) => void;
};

function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });
}

export function ClinicMessagesInboxPanel({
  compact = false,
  scroll,
  fillsContainer = false,
  selectedConversationId,
  onConversationSelect,
  onConversationsChange,
  onInboxVisibilityChange,
}: ClinicMessagesInboxPanelProps) {
  const { user } = useAuth();
  const { refreshClinicProfile } = useClinicProfile();
  const { refreshUnread } = useMessageUnread();
  const [conversations, setConversations] = useState<
    Awaited<ReturnType<typeof listConversationsForClinic>>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const styles = useThemedStyles(() => ({
    content: {
      flex: compact ? 1 : undefined,
      minHeight: compact ? 0 : undefined,
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
      await refreshClinicProfile();
      const rows = await listConversationsForClinic(user.id);
      publishConversations(rows);
      setLoadError(null);
      await refreshUnread();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load conversations.');
      publishConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [publishConversations, refreshClinicProfile, refreshUnread, user?.id]);

  useRefreshOnFocus(load);
  const { refreshing, onRefresh } = usePullToRefresh(load);

  useInboxConversationRealtime(user?.id, 'clinic', (update) => {
    if (!user?.id) return;
    setConversations((current) => {
      const index = current.findIndex((row) => row.id === update.id);
      if (index === -1) return current;

      const next = [...current];
      next[index] = patchConversationFromRealtimeUpdate(next[index]!, update, user.id, 'clinic');
      const sorted = sortConversations(next);
      onConversationsChange?.(sorted);
      return sorted;
    });
    void refreshUnread();
  });

  useInboxRealtime(user?.id, 'clinic', (message) => {
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

    const preview = getMessageThreadPreview(conversation, 'clinic');
    router.push(
      getConversationMessagesRoute(
        conversation,
        'clinic',
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
        subtitle={CLINIC_MESSAGES_SUBTITLE}
        scroll={scroll ?? !compact}
        fillsContainer={fillsContainer}
        animateEntry={false}
        hideAtmosphere={compact}
        transparentBackground={compact}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <Screen
      title="Messages"
      subtitle={CLINIC_MESSAGES_SUBTITLE}
      constrainWidth={!compact}
      scroll={scroll ?? !compact}
      fillsContainer={fillsContainer}
      animateEntry={false}
      hideAtmosphere={compact}
      transparentBackground={compact}
      refreshing={refreshing}
      onRefresh={onRefresh}
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
          <MessagingInboxSkeleton compact={compact} />
        ) : (
          <ConversationInboxList
            conversations={conversations}
            role="clinic"
            userId={user.id}
            avatarKind="worker"
            compact={compact}
            selectedConversationId={selectedConversationId}
            header={<ClinicMessagingPreferences variant="compact" />}
            onInboxVisibilityChange={onInboxVisibilityChange}
            onConversationPress={handleConversationPress}
            onConversationHidden={load}
          />
        )}
      </View>
    </Screen>
  );
}
