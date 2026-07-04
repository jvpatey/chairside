import type { Conversation, MessageSearchHit } from '@chairside/api';
import { searchMessagesInConversations } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ConversationInboxFilters } from '@/components/messaging/ConversationInboxFilters';
import { ConversationInboxGroup } from '@/components/messaging/ConversationInboxGroup';
import { MessagingEmptyState } from '@/components/messaging/MessagingEmptyState';
import { ConversationListItem } from '@/components/messaging/ConversationListItem';
import { hideConversation } from '@/lib/conversationHide';
import {
  buildConversationInboxSections,
  filterConversations,
  getConversationFilterCounts,
  getConversationInboxEmptyMessage,
  type ConversationInboxFilter,
} from '@/lib/conversationInbox';
import {
  formatMessageSearchPreview,
  matchesConversationSearch,
} from '@/lib/messageThreadDisplay';
import { webPointer } from '@/lib/webPressableStyles';
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
  if (filter === 'unread') return "You're all caught up";
  if (filter === 'all') return 'No messages yet';
  return 'No matching conversations';
}

export function ConversationInboxList({
  conversations,
  role,
  userId,
  avatarKind,
  header,
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
  const [searchFocused, setSearchFocused] = useState(false);

  const styles = useThemedStyles(({ spacing, colors, typography, isDark }) => ({
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
    headerBlock: {
      gap: spacing.sm,
      paddingBottom: spacing.xs,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'transparent',
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      minHeight: 42,
    },
    searchWrapFocused: {
      backgroundColor: colors.surface,
      borderColor: colors.primary,
    },
    searchIcon: {
      flexShrink: 0,
    },
    searchInput: {
      ...typography.body,
      flex: 1,
      color: colors.labelPrimary,
      padding: 0,
    },
    clearButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      ...webPointer(),
    },
    searchMeta: {
      fontSize: 12,
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
    },
    listSections: {
      gap: compact ? spacing.xs : spacing.sm,
    },
    standaloneCard: {
      backgroundColor: colors.surface,
      borderRadius: compact ? 14 : 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
      ...(isDark
        ? {}
        : ({
            // @ts-expect-error — boxShadow is web-only
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          } as const)),
    },
    chipWrap: {
      paddingTop: 2,
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
  const messageMatchCount = hasSearch ? Object.keys(messageSearchHits).length : 0;

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
            <View key={conversation.id} style={styles.standaloneCard}>
              <ConversationListItem
                conversation={conversation}
                avatarKind={avatarKind}
                role={role}
                viewerId={userId}
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
            </View>
          );
        })}
      </View>
    );

  const headerContent = (
    <View style={styles.headerBlock}>
      {header ? header : null}

      {conversations.length > 0 ? (
        <>
          <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
            <Ionicons
              name="search"
              size={17}
              color={searchFocused ? colors.primary : colors.labelTertiary}
              style={styles.searchIcon}
            />
            <TextInput
              accessibilityLabel="Search conversations and messages"
              placeholder="Search name or messages"
              placeholderTextColor={colors.labelTertiary}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color={colors.labelTertiary} />
              </Pressable>
            ) : null}
          </View>
          {hasSearch && debouncedQuery.length >= MESSAGE_SEARCH_MIN_LENGTH ? (
            <Text style={styles.searchMeta}>
              {isSearchingMessages
                ? 'Searching messages…'
                : messageMatchCount > 0
                  ? `${messageMatchCount} conversation${messageMatchCount === 1 ? '' : 's'} with matching messages`
                  : 'No message body matches yet'}
            </Text>
          ) : null}
          <View style={styles.chipWrap}>
            <ConversationInboxFilters selected={filter} counts={filterCounts} onChange={setFilter} />
          </View>
        </>
      ) : null}
    </View>
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
