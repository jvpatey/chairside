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

export default function ClinicMessagesScreen() {
  const { user } = useAuth();
  const { refreshClinicProfile } = useClinicProfile();
  const { refreshUnread } = useMessageUnread();
  const [conversations, setConversations] = useState<Awaited<
    ReturnType<typeof listConversationsForClinic>
  >>([]);

  const load = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      return;
    }

    try {
      await refreshClinicProfile();
      const rows = await listConversationsForClinic(user.id);
      setConversations(rows);
      await refreshUnread();
    } catch {
      setConversations([]);
    }
  }, [refreshClinicProfile, refreshUnread, user?.id]);

  useRefreshOnFocus(load);

  if (!user?.id) {
    return (
      <Screen
        title="Messages"
        subtitle="Conversations with applicants about roles, fill-ins, and general inquiries."
      />
    );
  }

  return (
    <Screen
      title="Messages"
      subtitle="Conversations with applicants about roles, fill-ins, and general inquiries.">
      <ConversationInboxList
        conversations={conversations}
        role="clinic"
        userId={user.id}
        avatarKind="worker"
        header={<ClinicMessagingPreferences variant="compact" />}
        filterBesideHeader
        onConversationPress={(conversation) => {
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
        }}
        onConversationHidden={load}
      />
    </Screen>
  );
}
