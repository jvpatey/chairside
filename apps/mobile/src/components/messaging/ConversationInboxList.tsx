import type { Conversation, MessageSearchHit } from '@chairside/api';
import { searchMessagesInConversations } from '@chairside/api';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { ConversationInboxGroup } from '@/components/messaging/ConversationInboxGroup';
import { MessagingEmptyState } from '@/components/messaging/MessagingEmptyState';
import { ConversationListItem } from '@/components/messaging/ConversationListItem';
import { ListSearchFilterRow } from '@/components/ui/ListSearchFilterRow';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { hideConversation } from '@/lib/conversationHide';
import {
  buildConversationInboxSections,
  filterConversations,
  getConversationFilterCounts,
  getConversationInboxEmptyMessage,
  type ConversationInboxFilter,
} from '@/lib/conversationInbox';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { formatMessageSearchPreview, matchesConversationSearch } from '@/lib/messageThreadDisplay';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import type { MessageThreadFocus } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

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
  if (filter === 'general') return 'No open inquiries';
  return 'No matching conversations';
}

function shouldShowInboxTab(
  value: ConversationInboxFilter,
  counts: ReturnType<typeof getConversationFilterCounts>,
): boolean {
  if (value === 'all' || value === 'unread') return true;
  return counts[value] > 0;
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
  const [filter, setFilter] = useState<ConversationInboxFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [messageSearchHits, setMessageSearchHits] = useState<Record<string, MessageSearchHit>>({});
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);

  const styles = useThemedStyles(({ spacing, colors }) => ({
    content: {
      flex: compact ? 1 : undefined,
      minHeight: compact ? 0 : undefined,
    },
    scrollContent: {
      gap: spacing.md,
      paddingTop: compact ? spacing.md : 0,
      paddingBottom: spacing.md,
    },
    headerBlock: {
      flexShrink: 0,
    },
    headerBlockSpaced: {
      marginBottom: spacing.md,
    },
    chrome: {
      flexShrink: 0,
      gap: spacing.md,
    },
    searchBlock: {
      gap: spacing.xs,
      flexShrink: 0,
    },
    searchMeta: {
      fontSize: 12,
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
    },
    listSections: {
      gap: spacing.md,
    },
    inboxStack: {
      flex: compact ? 1 : undefined,
      minHeight: compact ? 0 : undefined,
      gap: spacing.md,
    },
    listScroll: {
      flex: 1,
      minHeight: 0,
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
  const inboxTabs = useMemo(
    () =>
      (
        [
          {
            value: 'all' as const,
            label: 'All',
            count: filterCounts.all,
            icon: 'chatbubbles-outline' as const,
            accent: 'primary' as const,
          },
          {
            value: 'unread' as const,
            label: 'Unread',
            count: filterCounts.unread,
            badgeCount: filterCounts.unread,
            icon: 'mail-unread-outline' as const,
            accent: 'primary' as const,
          },
          {
            value: 'roles' as const,
            label: 'Roles',
            count: filterCounts.roles,
            icon: 'briefcase-outline' as const,
            accent: 'primary' as const,
          },
          {
            value: 'fill_ins' as const,
            label: 'Fill-ins',
            count: filterCounts.fill_ins,
            icon: FILL_IN_ICON.outline,
            accent: 'secondary' as const,
          },
          {
            value: 'general' as const,
            label: 'Open inquiries',
            count: filterCounts.general,
            icon: 'chatbubble-outline' as const,
            accent: 'primary' as const,
          },
        ] as const
      ).filter((tab) => shouldShowInboxTab(tab.value, filterCounts)),
    [filterCounts],
  );
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
        highlightQuery:
          debouncedQuery.length >= MESSAGE_SEARCH_MIN_LENGTH ? debouncedQuery : trimmed,
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
    // Defer so we never update MessageSplitView during this list's render.
    const handle = requestAnimationFrame(() => {
      onInboxVisibilityChange?.({ isFilteredEmpty });
    });
    return () => cancelAnimationFrame(handle);
  }, [isFilteredEmpty, onInboxVisibilityChange]);

  const listBody =
    filteredConversations.length === 0 ? (
      <MessagingEmptyState
        compact={compact}
        title={getEmptyStateTitle(filter, hasSearch)}
        body={hasSearch ? 'Try a different name, message text, or role title.' : emptyMessage}
      />
    ) : (
      <View style={styles.listSections}>
        <StaggeredList>
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
              <SurfaceCard key={conversation.id} padding="none">
                <ConversationListItem
                  conversation={conversation}
                  avatarKind={avatarKind}
                  role={role}
                  viewerId={userId}
                  compact={compact}
                  selected={conversation.id === selectedConversationId}
                  messageSearchPreview={preview}
                  searchQuery={searchQuery}
                  onPress={() =>
                    onConversationPress(conversation, getConversationFocus(conversation))
                  }
                  onDelete={async () => {
                    await hideConversation(conversation, role, userId);
                    onConversationHidden();
                  }}
                />
              </SurfaceCard>
            );
          })}
        </StaggeredList>
      </View>
    );

  const headerContent = header ? (
    <View style={[styles.headerBlock, !compact && styles.headerBlockSpaced]}>{header}</View>
  ) : null;

  const searchMeta =
    hasSearch && debouncedQuery.length >= MESSAGE_SEARCH_MIN_LENGTH ? (
      <Text style={styles.searchMeta}>
        {isSearchingMessages
          ? 'Searching messages…'
          : messageMatchCount > 0
            ? `${messageMatchCount} conversation${messageMatchCount === 1 ? '' : 's'} with matching messages`
            : 'No message body matches yet'}
      </Text>
    ) : null;

  const searchRow =
    conversations.length > 0 ? (
      <View style={styles.searchBlock}>
        <ListSearchFilterRow
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search name or messages"
          accessibilityLabel="Search conversations and messages"
        />
        {searchMeta}
      </View>
    ) : null;

  const filterTabs =
    conversations.length > 0 ? (
      <FileTabWell
        variant="inline"
        tabsOnly={compact}
        fillHeight={compact ? false : undefined}
        tabs={inboxTabs}
        selected={filter}
        onSelect={setFilter}
      />
    ) : null;

  if (compact) {
    return (
      <View style={styles.content}>
        <View style={styles.chrome}>
          {headerContent}
          {searchRow}
          {filterTabs}
        </View>
        {conversations.length > 0 ? (
          <ScrollView
            style={[styles.listScroll, webScrollbarStyles()]}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {listBody}
          </ScrollView>
        ) : (
          listBody
        )}
      </View>
    );
  }

  const inboxWell =
    conversations.length > 0 ? (
      <>
        {searchRow}
        <FileTabWell variant="inline" tabs={inboxTabs} selected={filter} onSelect={setFilter}>
          {listBody}
        </FileTabWell>
      </>
    ) : (
      listBody
    );

  return (
    <View style={styles.content}>
      {headerContent}
      <View style={styles.inboxStack}>{inboxWell}</View>
    </View>
  );
}
