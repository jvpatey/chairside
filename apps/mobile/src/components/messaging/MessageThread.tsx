import {
  getConversation,
  getMessageDeliveryStatus,
  listMessages,
  markConversationRead,
  sendMessage,
  type Conversation,
} from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { MessageBubble } from '@/components/messaging/MessageBubble';
import { MessageComposeBar } from '@/components/messaging/MessageComposeBar';
import { MessageDateSeparator } from '@/components/messaging/MessageDateSeparator';
import { MessageThreadHeader } from '@/components/messaging/MessageThreadHeader';
import { MessagingEmptyState } from '@/components/messaging/MessagingEmptyState';
import { MessagingThreadSkeleton } from '@/components/messaging/MessagingSkeleton';
import { TypingIndicator } from '@/components/messaging/TypingIndicator';
import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useConversationRealtime } from '@/hooks/useConversationRealtime';
import { useMessageRealtime } from '@/hooks/useMessageRealtime';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { formatConversationDisplay } from '@/lib/conversationDisplay';
import {
  buildThreadListItems,
  createPendingMessage,
  findLatestMatchingMessageId,
  findThreadListIndexForMessage,
  type ThreadListItem,
  type ThreadMessage,
} from '@/lib/messageThreadDisplay';
import { webPointer } from '@/lib/webPressableStyles';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles } from '@/theme';

const MESSAGE_PAGE_SIZE = 50;
const SEARCH_HIGHLIGHT_DURATION_MS = 2800;
const SCROLL_NEAR_BOTTOM_THRESHOLD = 120;
const SCROLL_LOAD_EARLIER_THRESHOLD = 48;

type MessageThreadProps = {
  userId: string;
  role: 'worker' | 'clinic';
  conversationId: string;
  title: string;
  subtitle: string;
  /** When true, omits back navigation (split-view detail pane). */
  embedded?: boolean;
  /** When false, thread header shows only the counterpart name (web context panel shows details). */
  showContextDetails?: boolean;
  /** Scroll to and briefly highlight a message opened from inbox search. */
  scrollToMessageId?: string;
  /** Highlight matching text inside the focused message bubble. */
  highlightQuery?: string;
  onBack?: () => void;
  onConversationChange?: (conversation: Conversation) => void;
};

function getEmptyStateCopy(
  conversation: Conversation | null,
  canSend: boolean,
): { title: string; body: string } {
  if (!canSend) {
    return {
      title: 'No messages yet',
      body: 'This conversation is closed, but you can still read messages here when they arrive.',
    };
  }
  if (conversation?.conversation_type === 'general') {
    return {
      title: 'Start the conversation',
      body: 'Ask about future opportunities, availability, or the clinic’s team.',
    };
  }
  if (conversation?.conversation_type === 'outreach') {
    return {
      title: 'Reply to the clinic',
      body: 'Let the clinic know if you can cover this fill-in.',
    };
  }
  return {
    title: 'No messages yet',
    body: 'Send a message to start the conversation.',
  };
}

function getClosedBannerMessage(conversation: Conversation | null): string {
  if (conversation?.counterpart_account_deleted) {
    return 'This person is no longer signed up for Chairside. You can still read past messages.';
  }
  if (conversation?.conversation_type === 'general') {
    return 'This clinic is no longer accepting general messages. You can still read past messages.';
  }
  if (conversation?.conversation_type === 'outreach') {
    return 'This fill-in outreach thread is closed. You can still read past messages.';
  }
  return 'This conversation is closed. You can still read past messages.';
}

export function MessageThread({
  userId,
  role,
  conversationId,
  title,
  subtitle,
  embedded = false,
  showContextDetails = true,
  scrollToMessageId,
  highlightQuery,
  onBack,
  onConversationChange,
}: MessageThreadProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabDockInset = useMobileTabDockInset({ enabled: !embedded });
  const { refreshUnread } = useMessageUnread();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [keyboardLift, setKeyboardLift] = useState(0);
  const [composeHeight, setComposeHeight] = useState(72);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isResolvingSearchFocus, setIsResolvingSearchFocus] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const containerRef = useRef<View>(null);
  const listRef = useRef<FlatList<ThreadListItem>>(null);
  const seenMessageIds = useRef(new Set<string>());
  const entryAnimateMessageIds = useRef(new Set<string>());
  const loadedConversationIdRef = useRef<string | null>(null);
  const onConversationChangeRef = useRef(onConversationChange);
  const suppressAutoScrollRef = useRef(Boolean(scrollToMessageId || highlightQuery?.trim()));
  const searchFocusAttemptedRef = useRef(false);
  onConversationChangeRef.current = onConversationChange;

  useEffect(() => {
    if (conversation) {
      onConversationChangeRef.current?.(conversation);
    }
  }, [conversation]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: embedded ? spacing.md : insets.top + spacing.sm,
    },
    list: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    listContent: {
      paddingVertical: spacing.md,
      flexGrow: 1,
      justifyContent: 'flex-end',
    },
    closedBanner: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.backgroundGrouped,
    },
    closedText: typography.subtitle,
    loadEarlierWrap: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    loadEarlierButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 999,
      backgroundColor: colors.backgroundGrouped,
      ...webPointer(),
    },
    loadEarlierText: {
      ...typography.subtitle,
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    errorWrap: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    composeWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      backgroundColor: colors.background,
    },
    scrollToLatest: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      ...webPointer(),
    },
    scrollToLatestPressed: {
      opacity: 0.9,
    },
    scrollToLatestText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    scrollToLatestBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    scrollToLatestBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primaryOnPrimary,
    },
  }));

  const scrollToLatest = useCallback((animated = true) => {
    if (suppressAutoScrollRef.current) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const scrollToMessage = useCallback((messageId: string, items: ThreadListItem[]) => {
    const index = findThreadListIndexForMessage(items, messageId);
    if (index < 0) return false;

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    });
    setHighlightedMessageId(messageId);
    setTimeout(() => {
      setHighlightedMessageId((current) => (current === messageId ? null : current));
      suppressAutoScrollRef.current = false;
    }, SEARCH_HIGHLIGHT_DURATION_MS);
    return true;
  }, []);

  const loadMessagesBeforeTarget = useCallback(
    async (targetMessageId: string, initialMessages: ThreadMessage[]) => {
      let batch = initialMessages;
      let more = initialMessages.length >= MESSAGE_PAGE_SIZE;

      while (!batch.some((message) => message.id === targetMessageId) && more) {
        const earliest = batch[0]?.created_at;
        if (!earliest) break;

        const earlier = await listMessages(conversationId, {
          before: earliest,
          limit: MESSAGE_PAGE_SIZE,
        });

        const unseen = earlier.filter((message) => !seenMessageIds.current.has(message.id));
        unseen.forEach((message) => seenMessageIds.current.add(message.id));
        batch = [...unseen, ...batch];
        more = earlier.length >= MESSAGE_PAGE_SIZE;
      }

      return { batch, hasMore: more };
    },
    [conversationId],
  );

  const syncKeyboardLift = useCallback((keyboardScreenY: number) => {
    containerRef.current?.measureInWindow((_x, y, _width, height) => {
      const containerBottom = y + height;
      setKeyboardLift(Math.max(0, containerBottom - keyboardScreenY));
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      syncKeyboardLift(event.endCoordinates.screenY);
      scrollToLatest(true);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardLift(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [scrollToLatest, syncKeyboardLift]);

  const markReadLocally = useCallback(
    (nextConversation: Conversation) => {
      const updated: Conversation = {
        ...nextConversation,
        unread: false,
        worker_last_read_at:
          role === 'worker' ? new Date().toISOString() : nextConversation.worker_last_read_at,
        clinic_last_read_at:
          role === 'clinic' ? new Date().toISOString() : nextConversation.clinic_last_read_at,
      };
      setConversation(updated);
    },
    [role],
  );

  const appendMessage = useCallback(
    (message: ThreadMessage) => {
      if (seenMessageIds.current.has(message.id)) return;
      seenMessageIds.current.add(message.id);
      entryAnimateMessageIds.current.add(message.id);
      setMessages((current) => [...current, message]);
      if (isNearBottom) {
        scrollToLatest(true);
      } else if (message.sender_id !== userId) {
        setNewMessageCount((count) => count + 1);
      }
    },
    [isNearBottom, scrollToLatest, userId],
  );

  const replaceMessage = useCallback((messageId: string, nextMessage: ThreadMessage) => {
    seenMessageIds.current.delete(messageId);
    seenMessageIds.current.add(nextMessage.id);
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? nextMessage : message)),
    );
  }, []);

  const load = useCallback(async () => {
    const isNewConversation = loadedConversationIdRef.current !== conversationId;
    if (isNewConversation) {
      setIsLoading(true);
      setLoadError(null);
      setConversation(null);
      setMessages([]);
      setHasMoreMessages(false);
      seenMessageIds.current = new Set();
      entryAnimateMessageIds.current = new Set();
      searchFocusAttemptedRef.current = false;
    }

    try {
      const [nextConversation, nextMessages] = await Promise.all([
        getConversation(userId, role, conversationId),
        listMessages(conversationId, { limit: MESSAGE_PAGE_SIZE }),
      ]);

      if (!nextConversation) {
        Alert.alert('Conversation not found', 'This thread may have been removed.');
        onBack?.();
        return;
      }

      loadedConversationIdRef.current = conversationId;
      seenMessageIds.current = new Set(nextMessages.map((message) => message.id));
      setConversation(nextConversation);
      setMessages(nextMessages);
      setHasMoreMessages(nextMessages.length >= MESSAGE_PAGE_SIZE);
      setLoadError(null);
      await markConversationRead(conversationId);
      await refreshUnread();
      markReadLocally(nextConversation);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load messages.');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, markReadLocally, onBack, refreshUnread, role, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    searchFocusAttemptedRef.current = false;
    suppressAutoScrollRef.current = Boolean(scrollToMessageId || highlightQuery?.trim());
    setHighlightedMessageId(null);
    setIsNearBottom(true);
    setNewMessageCount(0);
  }, [conversationId, highlightQuery, scrollToMessageId]);

  const { counterpartIsTyping, notifyTyping } = useTypingIndicator(
    conversationId,
    userId,
    Boolean(conversation?.can_send),
  );

  useConversationRealtime(conversationId, (update) => {
    setConversation((current) => {
      if (!current) return current;
      const updated: Conversation = {
        ...current,
        last_message_at: update.last_message_at,
        last_message_preview: update.last_message_preview,
        last_sender_id: update.last_sender_id,
        worker_last_read_at: update.worker_last_read_at,
        clinic_last_read_at: update.clinic_last_read_at,
        messaging_closed_at: update.messaging_closed_at,
      };
      return updated;
    });
  });

  useEffect(() => {
    if (isLoading || isResolvingSearchFocus || searchFocusAttemptedRef.current) return;

    const trimmedQuery = highlightQuery?.trim();
    const targetMessageId =
      scrollToMessageId ??
      (trimmedQuery ? findLatestMatchingMessageId(messages, trimmedQuery) : undefined);

    if (!targetMessageId) {
      if (scrollToMessageId || trimmedQuery) {
        suppressAutoScrollRef.current = false;
      }
      return;
    }

    searchFocusAttemptedRef.current = true;

    const resolveFocus = async () => {
      setIsResolvingSearchFocus(true);
      try {
        let nextMessages = messages;
        let nextHasMore = hasMoreMessages;

        if (!nextMessages.some((message) => message.id === targetMessageId)) {
          const loaded = await loadMessagesBeforeTarget(targetMessageId, nextMessages);
          nextMessages = loaded.batch;
          nextHasMore = loaded.hasMore;
          setMessages(nextMessages);
          setHasMoreMessages(nextHasMore);
        }

        const items = buildThreadListItems(nextMessages, userId);
        requestAnimationFrame(() => {
          scrollToMessage(targetMessageId, items);
        });
      } finally {
        setIsResolvingSearchFocus(false);
      }
    };

    void resolveFocus();
  }, [
    hasMoreMessages,
    highlightQuery,
    isLoading,
    isResolvingSearchFocus,
    loadMessagesBeforeTarget,
    messages,
    scrollToMessage,
    scrollToMessageId,
    userId,
  ]);

  const loadEarlierMessages = useCallback(async () => {
    if (isLoadingEarlier || !hasMoreMessages || messages.length === 0) return;

    setIsLoadingEarlier(true);
    try {
      const earliest = messages[0]?.created_at;
      if (!earliest) return;

      const earlier = await listMessages(conversationId, {
        before: earliest,
        limit: MESSAGE_PAGE_SIZE,
      });

      const unseen = earlier.filter((message) => !seenMessageIds.current.has(message.id));
      unseen.forEach((message) => seenMessageIds.current.add(message.id));
      setMessages((current) => [...unseen, ...current]);
      setHasMoreMessages(earlier.length >= MESSAGE_PAGE_SIZE);
    } catch (error) {
      Alert.alert(
        'Could not load earlier messages',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoadingEarlier(false);
    }
  }, [conversationId, hasMoreMessages, isLoadingEarlier, messages]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      const nearBottom = distanceFromBottom <= SCROLL_NEAR_BOTTOM_THRESHOLD;
      setIsNearBottom(nearBottom);
      if (nearBottom) {
        setNewMessageCount(0);
      }

      if (
        contentOffset.y <= SCROLL_LOAD_EARLIER_THRESHOLD &&
        hasMoreMessages &&
        !isLoadingEarlier &&
        !isLoading
      ) {
        void loadEarlierMessages();
      }
    },
    [hasMoreMessages, isLoading, isLoadingEarlier, loadEarlierMessages],
  );

  useMessageRealtime(conversationId, (message) => {
    appendMessage(message);
    if (message.sender_id !== userId) {
      void markConversationRead(conversationId).then(() => {
        refreshUnread();
        setConversation((current) => {
          if (!current) return current;
          const updated: Conversation = {
            ...current,
            unread: false,
            worker_last_read_at:
              role === 'worker' ? new Date().toISOString() : current.worker_last_read_at,
            clinic_last_read_at:
              role === 'clinic' ? new Date().toISOString() : current.clinic_last_read_at,
          };
          return updated;
        });
      });
    }
  });

  const sendBody = useCallback(
    async (body: string, existingPendingId?: string) => {
      if (!conversation?.can_send) return;

      let pending: ThreadMessage;
      if (existingPendingId) {
        const existing = messages.find((message) => message.id === existingPendingId);
        if (!existing) return;
        pending = { ...existing, clientStatus: 'pending' };
        replaceMessage(existingPendingId, pending);
      } else {
        pending = createPendingMessage(conversationId, userId, body);
        appendMessage(pending);
      }

      setIsSending(true);
      try {
        const saved = await sendMessage(userId, conversationId, body);
        replaceMessage(pending.id, saved);
        setConversation((current) => {
          if (!current) return current;
          const updated: Conversation = {
            ...current,
            last_message_at: saved.created_at,
            last_message_preview:
              saved.body.length > 120 ? `${saved.body.slice(0, 120).trim()}…` : saved.body,
            last_sender_id: userId,
            unread: false,
          };
          return updated;
        });
        await refreshUnread();
      } catch (error) {
        replaceMessage(pending.id, { ...pending, clientStatus: 'failed' });
        Alert.alert(
          'Could not send message',
          error instanceof Error ? error.message : 'Please try again.',
        );
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [
      appendMessage,
      conversation,
      conversationId,
      messages,
      refreshUnread,
      replaceMessage,
      userId,
    ],
  );

  const handleSend = async (body: string) => {
    await sendBody(body);
  };

  const handleRetryFailed = async (message: ThreadMessage) => {
    if (message.clientStatus !== 'failed') return;
    await sendBody(message.body, message.id);
  };

  const canSend = Boolean(conversation?.can_send);
  const headerDisplay = conversation ? formatConversationDisplay(conversation, role) : null;
  const headerTitle = headerDisplay?.threadTitle ?? title;
  const headerSubtitle = headerDisplay?.threadSubtitle ?? subtitle;
  const listItems = useMemo(() => buildThreadListItems(messages, userId), [messages, userId]);
  const emptyCopy = getEmptyStateCopy(conversation, canSend);
  const lastOwnMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message?.sender_id === userId) return message.id;
    }
    return null;
  }, [messages, userId]);

  const composeBottom = keyboardLift > 0 ? keyboardLift : tabDockInset;
  const listBottomPadding = canSend ? composeHeight + composeBottom + 8 : composeBottom + 16;
  const showScrollToLatest = !isNearBottom && (newMessageCount > 0 || messages.length > 0);

  const renderListItem = ({ item }: { item: ThreadListItem }) => {
    if (item.type === 'date') {
      return <MessageDateSeparator label={item.label} />;
    }

    const { message, isOwn, showTimestamp, groupedWithPrevious, groupedWithNext } = item;
    const status = message.clientStatus ?? 'sent';
    const isHighlighted = highlightedMessageId === message.id;
    const showDeliveryStatus = isOwn && message.id === lastOwnMessageId;
    const deliveryStatus =
      conversation && showDeliveryStatus
        ? getMessageDeliveryStatus(message, role, conversation)
        : null;
    const bubble = (
      <MessageBubble
        body={message.body}
        createdAt={message.created_at}
        isOwn={isOwn}
        showTimestamp={showTimestamp}
        groupedWithPrevious={groupedWithPrevious}
        groupedWithNext={groupedWithNext}
        status={status}
        deliveryStatus={deliveryStatus}
        showDeliveryStatus={showDeliveryStatus}
        highlighted={isHighlighted}
        highlightQuery={isHighlighted ? highlightQuery : undefined}
        animateEntry={
          entryAnimateMessageIds.current.has(message.id) && message.clientStatus !== 'pending'
        }
      />
    );

    if (status === 'failed') {
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry sending message"
          onPress={() => {
            void handleRetryFailed(message);
          }}>
          {bubble}
        </Pressable>
      );
    }

    return bubble;
  };

  const threadBody = (
    <>
      <View style={styles.header}>
        <MessageThreadHeader
          conversation={conversation}
          role={role}
          title={headerTitle}
          subtitle={headerSubtitle}
          compact={embedded}
          showContextDetails={showContextDetails}
          onBack={embedded ? undefined : onBack}
        />
      </View>

      {loadError ? (
        <View style={styles.errorWrap}>
          <DashboardErrorBanner
            message={loadError}
            onRetry={() => {
              void load();
            }}
          />
        </View>
      ) : null}

      {isLoading ? (
        <MessagingThreadSkeleton />
      ) : (
        <FlatList
          ref={listRef}
          style={[styles.list, webScrollbarStyles()]}
          contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPadding }]}
          data={listItems}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          ListHeaderComponent={
            hasMoreMessages ? (
              <View style={styles.loadEarlierWrap}>
                {Platform.OS === 'web' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Load earlier messages"
                    disabled={isLoadingEarlier}
                    onPress={() => {
                      void loadEarlierMessages();
                    }}
                    style={styles.loadEarlierButton}>
                    {isLoadingEarlier ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Text style={styles.loadEarlierText}>Load earlier messages</Text>
                    )}
                  </Pressable>
                ) : isLoadingEarlier ? (
                  <ActivityIndicator size="small" />
                ) : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loadError ? (
              <MessagingEmptyState title={emptyCopy.title} body={emptyCopy.body} compact />
            ) : null
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          maintainVisibleContentPosition={
            Platform.OS === 'ios' ? { minIndexForVisible: 1, autoscrollToTopThreshold: 24 } : undefined
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollToIndexFailed={({ index }) => {
            requestAnimationFrame(() => {
              listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
            });
          }}
          onContentSizeChange={() => {
            if (suppressAutoScrollRef.current || isResolvingSearchFocus) return;
            if (messages.length > 0 && !isLoadingEarlier) {
              scrollToLatest(false);
            }
          }}
        />
      )}

      {showScrollToLatest ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scroll to latest messages"
          onPress={() => {
            setNewMessageCount(0);
            scrollToLatest(true);
          }}
          style={({ pressed }) => [
            styles.scrollToLatest,
            { bottom: listBottomPadding + 12 },
            pressed && styles.scrollToLatestPressed,
          ]}>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
          <Text style={styles.scrollToLatestText}>Latest</Text>
          {newMessageCount > 0 ? (
            <View style={styles.scrollToLatestBadge}>
              <Text style={styles.scrollToLatestBadgeText}>
                {newMessageCount > 9 ? '9+' : newMessageCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {!canSend && conversation ? (
        <View style={[styles.closedBanner, { marginBottom: listBottomPadding }]}>
          <Text style={styles.closedText}>{getClosedBannerMessage(conversation)}</Text>
        </View>
      ) : null}

      {canSend ? (
        <View
          style={[styles.composeWrap, { bottom: composeBottom }]}
          onLayout={(event) => {
            setComposeHeight(event.nativeEvent.layout.height);
          }}>
          <TypingIndicator visible={counterpartIsTyping} />
          <MessageComposeBar
            conversationId={conversationId}
            sending={isSending}
            onFocus={() => scrollToLatest(true)}
            onChangeText={() => notifyTyping()}
            onSend={handleSend}
          />
        </View>
      ) : null}
    </>
  );

  return (
    <View ref={containerRef} style={styles.container} collapsable={false}>
      {embedded ? threadBody : <WebPageEnter animate={false} style={{ flex: 1 }}>{threadBody}</WebPageEnter>}
    </View>
  );
}

/** @deprecated Use MessageThread */
export const ApplicationMessageThread = MessageThread;
