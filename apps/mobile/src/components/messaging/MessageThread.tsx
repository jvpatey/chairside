import {
  getConversation,
  listMessages,
  markConversationRead,
  sendMessage,
  type Conversation,
  type Message,
} from '@chairside/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Keyboard, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageBubble } from '@/components/messaging/MessageBubble';
import { MessageComposeBar } from '@/components/messaging/MessageComposeBar';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useMessageRealtime } from '@/hooks/useMessageRealtime';
import { formatConversationDisplay } from '@/lib/conversationDisplay';
import { useThemedStyles } from '@/theme';

type MessageThreadProps = {
  userId: string;
  role: 'worker' | 'clinic';
  conversationId: string;
  title: string;
  subtitle: string;
  onBack: () => void;
  onConversationChange?: (conversation: Conversation) => void;
};

function getEmptyStateMessage(conversation: Conversation | null, canSend: boolean): string {
  if (!canSend) return 'No messages yet.';
  if (conversation?.conversation_type === 'general') {
    return 'Ask about future opportunities, availability, or the clinic’s team.';
  }
  return 'Send a message to start the conversation.';
}

function getClosedBannerMessage(conversation: Conversation | null): string {
  if (conversation?.counterpart_account_deleted) {
    return 'This person is no longer signed up for Chairside. You can still read past messages.';
  }
  if (conversation?.conversation_type === 'general') {
    return 'This clinic is no longer accepting general messages. You can still read past messages.';
  }
  return 'This conversation is closed. You can still read past messages.';
}

export function MessageThread({
  userId,
  role,
  conversationId,
  title,
  subtitle,
  onBack,
  onConversationChange,
}: MessageThreadProps) {
  const insets = useSafeAreaInsets();
  const { refreshUnread } = useMessageUnread();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [keyboardLift, setKeyboardLift] = useState(0);
  const [composeHeight, setComposeHeight] = useState(72);
  const containerRef = useRef<View>(null);
  const listRef = useRef<FlatList<Message>>(null);
  const seenMessageIds = useRef(new Set<string>());

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: insets.top + spacing.sm,
    },
    list: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    listContent: {
      gap: spacing.sm,
      paddingVertical: spacing.md,
      flexGrow: 1,
      justifyContent: 'flex-end',
    },
    empty: {
      ...typography.subtitle,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
    closedBanner: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.backgroundGrouped,
    },
    closedText: typography.subtitle,
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
  }));

  const scrollToLatest = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

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

  const appendMessage = useCallback(
    (message: Message) => {
      if (seenMessageIds.current.has(message.id)) return;
      seenMessageIds.current.add(message.id);
      setMessages((current) => [...current, message]);
      scrollToLatest(true);
    },
    [scrollToLatest],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextConversation, nextMessages] = await Promise.all([
        getConversation(userId, role, conversationId),
        listMessages(conversationId),
      ]);

      if (!nextConversation) {
        Alert.alert('Conversation not found', 'This thread may have been removed.');
        onBack();
        return;
      }

      seenMessageIds.current = new Set(nextMessages.map((message) => message.id));
      setConversation(nextConversation);
      onConversationChange?.(nextConversation);
      setMessages(nextMessages);
      await markConversationRead(conversationId);
      await refreshUnread();
      setConversation((current) =>
        current
          ? {
              ...current,
              unread: false,
              worker_last_read_at:
                role === 'worker' ? new Date().toISOString() : current.worker_last_read_at,
              clinic_last_read_at:
                role === 'clinic' ? new Date().toISOString() : current.clinic_last_read_at,
            }
          : current,
      );
    } catch (error) {
      Alert.alert(
        'Could not load messages',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, onBack, onConversationChange, refreshUnread, role, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useMessageRealtime(conversationId, (message) => {
    appendMessage(message);
    if (message.sender_id !== userId) {
      void markConversationRead(conversationId).then(() => refreshUnread());
    }
  });

  const handleSend = async (body: string) => {
    if (!conversation?.can_send) return;

    setIsSending(true);
    try {
      const message = await sendMessage(userId, conversationId, body);
      appendMessage(message);
      await refreshUnread();
    } catch (error) {
      Alert.alert(
        'Could not send message',
        error instanceof Error ? error.message : 'Please try again.',
      );
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const canSend = Boolean(conversation?.can_send);
  const headerDisplay = conversation
    ? formatConversationDisplay(conversation, role)
    : null;
  const headerTitle = headerDisplay?.threadTitle ?? title;
  const headerSubtitle = headerDisplay?.threadSubtitle ?? subtitle;

  return (
    <View ref={containerRef} style={styles.container} collapsable={false}>
      <View style={styles.header}>
        <AuthScreenHeader title={headerTitle} subtitle={headerSubtitle} onBack={onBack} />
      </View>

      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: composeHeight + keyboardLift + 8 },
        ]}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            body={item.body}
            createdAt={item.created_at}
            isOwn={item.sender_id === userId}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.empty}>{getEmptyStateMessage(conversation, canSend)}</Text>
          ) : null
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            scrollToLatest(false);
          }
        }}
      />

      {!canSend ? (
        <View style={[styles.closedBanner, { marginBottom: composeHeight + keyboardLift }]}>
          <Text style={styles.closedText}>{getClosedBannerMessage(conversation)}</Text>
        </View>
      ) : null}

      <View
        style={[styles.composeWrap, { bottom: keyboardLift }]}
        onLayout={(event) => {
          setComposeHeight(event.nativeEvent.layout.height);
        }}>
        <MessageComposeBar
          disabled={!canSend}
          sending={isSending}
          onFocus={() => scrollToLatest(true)}
          onSend={handleSend}
        />
      </View>
    </View>
  );
}

/** @deprecated Use MessageThread */
export const ApplicationMessageThread = MessageThread;
