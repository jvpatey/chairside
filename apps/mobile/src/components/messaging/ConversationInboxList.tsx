import type { Conversation } from '@chairside/api';
import { useMemo, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ConversationFilterBar } from '@/components/messaging/ConversationFilterBar';
import { ConversationListItem } from '@/components/messaging/ConversationListItem';
import { confirmHideConversation } from '@/lib/conversationHide';
import {
  filterConversations,
  getConversationFilterCounts,
  getConversationInboxEmptyMessage,
  type ConversationInboxFilter,
} from '@/lib/conversationInbox';
import { useThemedStyles } from '@/theme';

type ConversationInboxListProps = {
  conversations: Conversation[];
  role: 'worker' | 'clinic';
  userId: string;
  avatarKind: 'clinic' | 'worker';
  header?: ReactNode;
  onConversationPress: (conversation: Conversation) => void;
  onConversationHidden: () => void;
};

export function ConversationInboxList({
  conversations,
  role,
  userId,
  avatarKind,
  header,
  onConversationPress,
  onConversationHidden,
}: ConversationInboxListProps) {
  const [filter, setFilter] = useState<ConversationInboxFilter>('all');

  const styles = useThemedStyles(({ spacing, typography }) => ({
    content: { gap: spacing.md },
    list: { gap: spacing.md },
    empty: typography.subtitle,
  }));

  const filterCounts = useMemo(() => getConversationFilterCounts(conversations), [conversations]);
  const filteredConversations = useMemo(
    () => filterConversations(conversations, filter),
    [conversations, filter],
  );

  const emptyMessage =
    conversations.length === 0
      ? getConversationInboxEmptyMessage('all', role)
      : getConversationInboxEmptyMessage(filter, role);

  return (
    <View style={styles.content}>
      {header}

      {conversations.length > 0 ? (
        <ConversationFilterBar selected={filter} counts={filterCounts} onChange={setFilter} />
      ) : null}

      {filteredConversations.length === 0 ? (
        <Text style={styles.empty}>{emptyMessage}</Text>
      ) : (
        <View style={styles.list}>
          {filteredConversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              avatarKind={avatarKind}
              role={role}
              onPress={() => onConversationPress(conversation)}
              onDelete={() =>
                confirmHideConversation(conversation, role, userId, onConversationHidden)
              }
            />
          ))}
        </View>
      )}
    </View>
  );
}
