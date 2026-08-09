import type { Conversation } from '@chairside/api';
import { getErrorMessage, listConversationsForClinic } from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { ClinicMessagingPreferences } from '@/components/clinic/ClinicMessagingPreferences';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { ConversationInboxList } from '@/components/messaging/ConversationInboxList';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useClinicActingContext } from '@/hooks/useClinicActingContext';
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
  const { clinicId, scopedLocationIds } = useClinicActingContext();
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

  // Notify parent after commit — never during render or setState updaters.
  useEffect(() => {
    onConversationsChange?.(conversations);
  }, [conversations, onConversationsChange]);

  const load = useCallback(async () => {
    if (!clinicId) {
      setConversations([]);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    setIsLoading(true);
    try {
      const rows = await listConversationsForClinic(clinicId, {
        locationIds: scopedLocationIds,
      });
      setConversations(rows);
      setLoadError(null);
      await refreshUnread();
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Could not load conversations.'));
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, refreshUnread, scopedLocationIds]);

  useRefreshOnFocus(load);
  const { refreshing, onRefresh } = usePullToRefresh(load);

  useInboxConversationRealtime(clinicId ?? undefined, 'clinic', (update) => {
    if (!user?.id) return;
    setConversations((current) => {
      const index = current.findIndex((row) => row.id === update.id);
      if (index === -1) return current;

      const next = [...current];
      next[index] = patchConversationFromRealtimeUpdate(next[index]!, update, user.id, 'clinic');
      return sortConversations(next);
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
      // Shared inbox: only candidate sends are unread for clinic viewers.
      next[index] = {
        ...row,
        last_message_at: message.created_at,
        last_message_preview:
          message.body.length > 120 ? `${message.body.slice(0, 120).trim()}…` : message.body,
        last_sender_id: message.sender_id,
        unread: message.sender_id === row.worker_id,
      };
      return sortConversations(next);
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
        subtitle={compact ? undefined : CLINIC_MESSAGES_SUBTITLE}
        scroll={scroll ?? !compact}
        fillsContainer={fillsContainer}
        hideAtmosphere={compact}
        transparentBackground={compact}
        animateEntry={!compact}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <Screen
      title="Messages"
      subtitle={compact ? undefined : CLINIC_MESSAGES_SUBTITLE}
      constrainWidth={!compact}
      scroll={scroll ?? !compact}
      fillsContainer={fillsContainer}
      hideAtmosphere={compact}
      transparentBackground={compact}
      animateEntry={!compact}
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
          <PageLoadingList message="Loading messages…" compact={compact} />
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
