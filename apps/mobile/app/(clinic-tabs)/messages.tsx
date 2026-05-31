import { listConversationsForClinic } from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { ConversationListItem } from '@/components/messaging/ConversationListItem';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getClinicApplicationMessagesRoute } from '@/lib/routing';
import { getMessageThreadPreview } from '@/lib/conversationDisplay';
import { useThemedStyles } from '@/theme';

export default function ClinicMessagesScreen() {
  const { user } = useAuth();
  const { refreshUnread } = useMessageUnread();
  const [conversations, setConversations] = useState<Awaited<
    ReturnType<typeof listConversationsForClinic>
  >>([]);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    list: { gap: spacing.md },
    empty: typography.subtitle,
  }));

  const load = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      return;
    }

    try {
      const rows = await listConversationsForClinic(user.id);
      setConversations(rows);
      await refreshUnread();
    } catch {
      setConversations([]);
    }
  }, [refreshUnread, user?.id]);

  useRefreshOnFocus(load);

  return (
    <Screen title="Messages" subtitle="Conversations with applicants about roles and fill-ins.">
      {conversations.length === 0 ? (
        <Text style={styles.empty}>
          No conversations yet. Message an applicant from their application details.
        </Text>
      ) : (
        <View style={styles.list}>
          {conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              avatarKind="worker"
              role="clinic"
              onPress={() => {
                const preview = getMessageThreadPreview(conversation, 'clinic');
                router.push(
                  getClinicApplicationMessagesRoute(conversation.application_id, 'messages-tab', {
                    conversationId: conversation.id,
                    ...preview,
                  }),
                );
              }}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
