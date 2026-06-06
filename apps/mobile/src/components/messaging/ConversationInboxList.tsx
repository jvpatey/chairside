import type { Conversation } from '@chairside/api';
import { useMemo, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { ConversationInboxFilters } from '@/components/messaging/ConversationInboxFilters';
import { ConversationListItem } from '@/components/messaging/ConversationListItem';
import { hideConversation } from '@/lib/conversationHide';
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
  filterBesideHeader?: boolean;
  onConversationPress: (conversation: Conversation) => void;
  onConversationHidden: () => void;
};

export function ConversationInboxList({
  conversations,
  role,
  userId,
  avatarKind,
  header,
  filterBesideHeader = false,
  onConversationPress,
  onConversationHidden,
}: ConversationInboxListProps) {
  const [filter, setFilter] = useState<ConversationInboxFilter>('all');

  const styles = useThemedStyles(({ spacing, typography }) => ({
    content: { gap: spacing.md },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerContent: {
      flex: 1,
      minWidth: 0,
    },
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
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

  const filterButton =
    conversations.length > 0 ? (
      <ConversationInboxFilters selected={filter} counts={filterCounts} onChange={setFilter} />
    ) : null;

  return (
    <View style={styles.content}>
      {header && filterBesideHeader ? (
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>{header}</View>
          {filterButton}
        </View>
      ) : null}

      {header && !filterBesideHeader ? header : null}

      {filterButton && !filterBesideHeader ? (
        <View style={styles.filterRow}>{filterButton}</View>
      ) : null}

      {filteredConversations.length === 0 ? (
        <Text style={styles.empty}>{emptyMessage}</Text>
      ) : (
        <BrowseListGroup>
          {filteredConversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              avatarKind={avatarKind}
              role={role}
              onPress={() => onConversationPress(conversation)}
              onDelete={async () => {
                await hideConversation(conversation, role, userId);
                onConversationHidden();
              }}
            />
          ))}
        </BrowseListGroup>
      )}
    </View>
  );
}
