import type { Conversation, MessageSearchHit } from '@chairside/api';
import { searchMessagesInConversations } from '@chairside/api';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { ConversationInboxGroup } from '@/components/messaging/ConversationInboxGroup';
import { MessagingEmptyState } from '@/components/messaging/MessagingEmptyState';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { ConversationInboxFilters } from '@/components/messaging/ConversationInboxFilters';
import { ConversationListItem } from '@/components/messaging/ConversationListItem';
import { hideConversation } from '@/lib/conversationHide';
import {
  buildConversationInboxSections,
  CONVERSATION_INBOX_FILTERS,
  filterConversations,
  getConversationFilterCounts,
  getConversationInboxEmptyMessage,
  type ConversationInboxFilter,
} from '@/lib/conversationInbox';
import {
  formatMessageSearchPreview,
  matchesConversationSearch,
} from '@/lib/messageThreadDisplay';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import type { MessageThreadFocus } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

const MESSAGE_SEARCH_DEBOUNCE_MS = 300;
const MESSAGE_SEARCH_MIN_LENGTH = 2;

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
  onConversationPress: (conversation: Conversation, focus?: MessageThreadFocus) => void;
  onConversationHidden: () => void;
};

function getEmptyStateTitle(filter: ConversationInboxFilter, hasSearch: boolean): string {
  if (hasSearch) return 'No matching conversations';
  if (filter === 'unread') return 'You’re all caught up';
  if (filter === 'all') return 'No messages yet';
  return 'No matching conversations';
}

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
  const { colors } = useTheme();
  const [filter, setFilter] = useState<ConversationInboxFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [messageSearchHits, setMessageSearchHits] = useState<Record<string, MessageSearchHit>>({});
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);

  const styles = useThemedStyles(({ spacing, colors, typography }) => ({
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
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    searchInput: {
      ...typography.body,
      flex: 1,
      color: colors.labelPrimary,
      padding: 0,
    },
    listSections: {
      gap: compact ? spacing.sm : spacing.md,
    },
    chipWrap: {
      marginTop: spacing.xs,
    },
  }));

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, MESSAGE_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.length < MESSAGE_SEARCH_MIN_LENGTH) {
      setMessageSearchHits({});
      setIsSearchingMessages(false);
      return;
    }

    let cancelled = false;
    setIsSearchingMessages(true);

    void searchMessagesInConversations(debouncedQuery)
      .then((hits) => {
        if (cancelled) return;
        const nextHits: Record<string, MessageSearchHit> = {};
        for (const hit of hits) {
          nextHits[hit.conversation_id] = hit;
        }
        setMessageSearchHits(nextHits);
      })
      .catch(() => {
        if (!cancelled) {
          setMessageSearchHits({});
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsSearchingMessages(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const filterCounts = useMemo(() => getConversationFilterCounts(conversations), [conversations]);
  const filteredConversations = useMemo(() => {
    const byFilter = filterConversations(conversations, filter);
    const trimmed = searchQuery.trim();
    if (!trimmed) return byFilter;

    return byFilter.filter(
      (conversation) =>
        matchesConversationSearch(conversation, trimmed) ||
        Boolean(messageSearchHits[conversation.id]),
    );
  }, [conversations, filter, messageSearchHits, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;

  const inboxSections = useMemo(
    () =>
      buildConversationInboxSections(filteredConversations, role, {
        groupEnabled: !hasSearch,
      }),
    [filteredConversations, hasSearch, role],
  );

  const getConversationFocus = (conversation: Conversation): MessageThreadFocus | undefined => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return undefined;

    const hit = messageSearchHits[conversation.id];
    if (hit) {
      return {
        scrollToMessageId: hit.id,
        highlightQuery: debouncedQuery.length >= MESSAGE_SEARCH_MIN_LENGTH ? debouncedQuery : trimmed,
      };
    }

    if (matchesConversationSearch(conversation, trimmed)) {
      return { highlightQuery: trimmed };
    }

    return undefined;
  };

  const emptyMessage =
    conversations.length === 0
      ? getConversationInboxEmptyMessage('all', role)
      : getConversationInboxEmptyMessage(filter, role);

  const filterButton =
    conversations.length > 0 && !compact ? (
      <ConversationInboxFilters selected={filter} counts={filterCounts} onChange={setFilter} />
    ) : null;

  const compactFilterOptions = useMemo(
    () =>
      CONVERSATION_INBOX_FILTERS.filter((option) => option.value === 'all' || filterCounts[option.value] > 0).map(
        (option) => ({
          value: option.value,
          label: `${option.label}${filterCounts[option.value] > 0 ? ` (${filterCounts[option.value]})` : ''}`,
        }),
      ),
    [filterCounts],
  );

  const isFilteredEmpty = conversations.length > 0 && filteredConversations.length === 0;

  useEffect(() => {
    onInboxVisibilityChange?.({ isFilteredEmpty });
  }, [isFilteredEmpty, onInboxVisibilityChange]);

  const listBody =
    filteredConversations.length === 0 ? (
      <MessagingEmptyState
        compact={compact}
        title={getEmptyStateTitle(filter, hasSearch)}
        body={
          hasSearch
            ? 'Try a different name, message text, or role title.'
            : emptyMessage
        }
      />
    ) : (
      <View style={styles.listSections}>
        {inboxSections.map((section) => {
          if (section.kind === 'group') {
            return (
              <ConversationInboxGroup
                key={`group-${section.threads[0]?.id ?? 'unknown'}`}
                threads={section.threads}
                avatarKind={avatarKind}
                role={role}
                compact={compact}
                selectedConversationId={selectedConversationId}
                searchQuery={searchQuery}
                messageSearchHits={messageSearchHits}
                debouncedQuery={debouncedQuery}
                onConversationPress={onConversationPress}
                getConversationFocus={getConversationFocus}
                onDelete={async (conversation) => {
                  await hideConversation(conversation, role, userId);
                  onConversationHidden();
                }}
              />
            );
          }

          const conversation = section.conversation;
          const hit = messageSearchHits[conversation.id];
          const preview = hit
            ? formatMessageSearchPreview(hit.body, debouncedQuery || searchQuery)
            : null;

          return (
            <BrowseListGroup key={conversation.id}>
              <ConversationListItem
                conversation={conversation}
                avatarKind={avatarKind}
                role={role}
                compact={compact}
                selected={conversation.id === selectedConversationId}
                messageSearchPreview={preview}
                searchQuery={searchQuery}
                onPress={() => onConversationPress(conversation, getConversationFocus(conversation))}
                onDelete={async () => {
                  await hideConversation(conversation, role, userId);
                  onConversationHidden();
                }}
              />
            </BrowseListGroup>
          );
        })}
      </View>
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

      {conversations.length > 0 ? (
        <View style={styles.searchWrap}>
          <TextInput
            accessibilityLabel="Search conversations and messages"
            placeholder="Search name or messages"
            placeholderTextColor={colors.labelTertiary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {isSearchingMessages ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>
      ) : null}

      {compact && conversations.length > 0 ? (
        <View style={styles.chipWrap}>
          <ChipSelector
            options={compactFilterOptions}
            selected={filter}
            onChange={setFilter}
            compact
          />
        </View>
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
