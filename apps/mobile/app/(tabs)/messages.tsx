import { listConversationsForWorker } from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { ConversationListItem } from '@/components/messaging/ConversationListItem';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getWorkerApplicationMessagesRoute } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function WorkerMessagesScreen() {
  const { user } = useAuth();
  const { refreshUnread } = useMessageUnread();
  const [conversations, setConversations] = useState<Awaited<
    ReturnType<typeof listConversationsForWorker>
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
      const rows = await listConversationsForWorker(user.id);
      setConversations(rows);
      await refreshUnread();
    } catch {
      setConversations([]);
    }
  }, [refreshUnread, user?.id]);

  useRefreshOnFocus(load);

  return (
    <Screen title="Messages" subtitle="Conversations about your applications and fill-ins.">
      {conversations.length === 0 ? (
        <Text style={styles.empty}>
          No conversations yet. Message a clinic from an application to start chatting.
        </Text>
      ) : (
        <View style={styles.list}>
          {conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              avatarKind="clinic"
              onPress={() =>
                router.push(
                  getWorkerApplicationMessagesRoute(conversation.application_id, 'messages-tab'),
                )
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
