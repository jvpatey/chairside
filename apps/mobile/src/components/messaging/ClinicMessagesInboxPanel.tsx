import type { Conversation } from '@chairside/api';
import { listConversationsForClinic } from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { ClinicMessagingPreferences } from '@/components/clinic/ClinicMessagingPreferences';
import { ConversationInboxList } from '@/components/messaging/ConversationInboxList';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getMessageThreadPreview } from '@/lib/conversationDisplay';
import { getConversationMessagesRoute } from '@/lib/routing';

const CLINIC_MESSAGES_SUBTITLE =
  'Conversations with applicants about roles, fill-ins, and general inquiries.';

type ClinicMessagesInboxPanelProps = {
  compact?: boolean;
  scroll?: boolean;
  fillsContainer?: boolean;
  selectedConversationId?: string | null;
  onConversationSelect?: (conversationId: string) => void;
  onConversationsChange?: (conversations: Conversation[]) => void;
  onInboxVisibilityChange?: (state: { isFilteredEmpty: boolean }) => void;
};

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
  const [conversations, setConversations] = useState<Awaited<
    ReturnType<typeof listConversationsForClinic>
  >>([]);

  const load = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      onConversationsChange?.([]);
      return;
    }

    try {
      await refreshClinicProfile();
      const rows = await listConversationsForClinic(user.id);
      setConversations(rows);
      onConversationsChange?.(rows);
      await refreshUnread();
    } catch {
      setConversations([]);
      onConversationsChange?.([]);
    }
  }, [onConversationsChange, refreshClinicProfile, refreshUnread, user?.id]);

  useRefreshOnFocus(load);

  const handleConversationPress = (conversation: Conversation) => {
    if (onConversationSelect) {
      onConversationSelect(conversation.id);
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
    >
      <ConversationInboxList
        conversations={conversations}
        role="clinic"
        userId={user.id}
        avatarKind="worker"
        compact={compact}
        selectedConversationId={selectedConversationId}
        header={<ClinicMessagingPreferences variant="compact" />}
        filterBesideHeader
        onInboxVisibilityChange={onInboxVisibilityChange}
        onConversationPress={handleConversationPress}
        onConversationHidden={load}
      />
    </Screen>
  );
}
