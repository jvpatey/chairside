import type { Conversation } from '@chairside/api';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

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
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useThemedStyles } from '@/theme';

type ConversationInboxListProps = {
  conversations: Conversation[];
  role: 'worker' | 'clinic';
  userId: string;
  avatarKind: 'clinic' | 'worker';
  header?: ReactNode;
  filterBesideHeader?: boolean;
  selectedConversationId?: string | null;
  compact?: boolean;
  onInboxVisibilityChange?: (state: { isFilteredEmpty: boolean }) => void;
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
  selectedConversationId,
  compact = false,
  onInboxVisibilityChange,
  onConversationPress,
  onConversationHidden,
}: ConversationInboxListProps) {
  const [filter, setFilter] = useState<ConversationInboxFilter>('all');

  const styles = useThemedStyles(({ spacing, typography }) => ({
    content: {
      gap: compact ? spacing.sm : spacing.md,
      flex: compact ? 1 : undefined,
      minHeight: compact ? 0 : undefined,
    },
    scrollContent: {
      gap: compact ? spacing.sm : spacing.md,
      paddingBottom: spacing.md,
    },
    scroll: {
      flex: 1,
    },
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

  const isFilteredEmpty = conversations.length > 0 && filteredConversations.length === 0;

  useEffect(() => {
    onInboxVisibilityChange?.({ isFilteredEmpty });
  }, [isFilteredEmpty, onInboxVisibilityChange]);

  const listBody =
    filteredConversations.length === 0 ? (
      <Text style={styles.empty}>{emptyMessage}</Text>
    ) : (
      <BrowseListGroup>
        {filteredConversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            avatarKind={avatarKind}
            role={role}
            compact={compact}
            selected={conversation.id === selectedConversationId}
            onPress={() => onConversationPress(conversation)}
            onDelete={async () => {
              await hideConversation(conversation, role, userId);
              onConversationHidden();
            }}
          />
        ))}
      </BrowseListGroup>
    );

  const headerContent = (
    <>
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
    </>
  );

  if (compact) {
    return (
      <View style={styles.content}>
        {headerContent}
        <ScrollView
          style={[styles.scroll, webScrollbarStyles()]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator>
          {listBody}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.content}>
      {headerContent}
      {listBody}
    </View>
  );
}
