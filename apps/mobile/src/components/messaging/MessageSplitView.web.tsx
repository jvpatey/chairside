import type { Conversation } from '@chairside/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ClinicMessagesInboxPanel } from '@/components/messaging/ClinicMessagesInboxPanel';
import { MessageThread } from '@/components/messaging/MessageThread';
import { MessageThreadPlaceholder } from '@/components/messaging/MessageThreadPlaceholder';
import {
  WorkerMessagesMasterPane,
  type WorkerMessagesMasterView,
} from '@/components/messaging/WorkerMessagesMasterPane';
import { MasterDetailLayout } from '@/components/ui/MasterDetailLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getMessageThreadPreview } from '@/lib/conversationDisplay';
import type { MessageThreadFocus } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

const MASTER_WIDTH = 380;

type MessageSplitViewProps = {
  role: 'worker' | 'clinic';
  initialConversationId?: string;
  masterView?: WorkerMessagesMasterView;
};

function renderDetailPane({
  role,
  userId,
  selectedId,
  inboxFilteredEmpty,
  preview,
  threadFocus,
  onConversationChange,
}: {
  role: 'worker' | 'clinic';
  userId: string | undefined;
  selectedId: string | null;
  inboxFilteredEmpty: boolean;
  preview: ReturnType<typeof getMessageThreadPreview> | null;
  threadFocus?: MessageThreadFocus | null;
  onConversationChange?: (conversation: Conversation) => void;
}) {
  if (!userId || inboxFilteredEmpty) {
    return <MessageThreadPlaceholder role={role} filteredEmpty={inboxFilteredEmpty} />;
  }

  if (!selectedId) {
    return <MessageThreadPlaceholder role={role} />;
  }

  return (
    <MessageThread
      embedded
      userId={userId}
      role={role}
      conversationId={selectedId}
      title={preview?.title ?? 'Messages'}
      subtitle={preview?.subtitle ?? ''}
      scrollToMessageId={threadFocus?.scrollToMessageId}
      highlightQuery={threadFocus?.highlightQuery}
      onConversationChange={onConversationChange}
    />
  );
}

function MessageContextPanel({
  preview,
  role,
}: {
  preview: ReturnType<typeof getMessageThreadPreview> | null;
  role: 'worker' | 'clinic';
}) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    panel: {
      flex: 1,
      padding: spacing.lg,
      gap: spacing.md,
    },
    label: {
      fontSize: 12,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    title: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    hint: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
  }));

  if (!preview) {
    return (
      <View style={styles.panel}>
        <Text style={styles.label}>Thread</Text>
        <Text style={styles.hint}>Select a conversation to see details here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.label}>{role === 'worker' ? 'Clinic' : 'Applicant'}</Text>
      <Text style={styles.title}>{preview.title}</Text>
      {preview.subtitle ? <Text style={styles.subtitle}>{preview.subtitle}</Text> : null}
      <Text style={styles.hint}>Press Escape to return focus to the inbox.</Text>
    </View>
  );
}

export function MessageSplitView({
  role,
  initialConversationId,
  masterView = 'inbox',
}: MessageSplitViewProps) {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);
  const [threadFocus, setThreadFocus] = useState<MessageThreadFocus | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inboxFilteredEmpty, setInboxFilteredEmpty] = useState(false);

  useEffect(() => {
    if (initialConversationId) {
      setSelectedId(initialConversationId);
    }
  }, [initialConversationId]);

  const handleConversationsChange = useCallback(
    (rows: Conversation[]) => {
      setConversations(rows);
      setSelectedId((current) => {
        if (current && rows.some((row) => row.id === current)) {
          return current;
        }
        if (initialConversationId && rows.some((row) => row.id === initialConversationId)) {
          return initialConversationId;
        }
        return rows[0]?.id ?? null;
      });
    },
    [initialConversationId],
  );

  const handleInboxVisibilityChange = useCallback((state: { isFilteredEmpty: boolean }) => {
    setInboxFilteredEmpty(state.isFilteredEmpty);
  }, []);

  const handleConversationChange = useCallback((conversation: Conversation) => {
    setConversations((current) =>
      current.map((row) => (row.id === conversation.id ? conversation : row)),
    );
  }, []);

  const selectedConversation = conversations.find((row) => row.id === selectedId) ?? null;
  const preview = selectedConversation
    ? getMessageThreadPreview(selectedConversation, role)
    : null;

  const handleConversationSelect = useCallback(
    (conversationId: string, focus?: MessageThreadFocus) => {
      setSelectedId(conversationId);
      setThreadFocus(focus ?? null);
    },
    [],
  );

  const inboxProps = useMemo(
    () => ({
      compact: true as const,
      scroll: false as const,
      fillsContainer: true as const,
      selectedConversationId: selectedId,
      onConversationSelect: handleConversationSelect,
      onConversationsChange: handleConversationsChange,
      onInboxVisibilityChange: handleInboxVisibilityChange,
    }),
    [
      selectedId,
      handleConversationSelect,
      handleConversationsChange,
      handleInboxVisibilityChange,
    ],
  );

  return (
    <MasterDetailLayout
      masterWidth={MASTER_WIDTH}
      showDetail
      master={
        role === 'worker' ? (
          <WorkerMessagesMasterPane
            masterView={masterView}
            inboxProps={inboxProps}
            onConversationStarted={setSelectedId}
          />
        ) : (
          <ClinicMessagesInboxPanel {...inboxProps} />
        )
      }
      detail={renderDetailPane({
        role,
        userId: user?.id,
        selectedId,
        inboxFilteredEmpty: masterView === 'inbox' && inboxFilteredEmpty,
        preview,
        threadFocus,
        onConversationChange: handleConversationChange,
      })}
      context={<MessageContextPanel preview={preview} role={role} />}
    />
  );
}

export function MessageThreadSplitView({
  role,
  conversationId,
  title,
  subtitle,
  scrollToMessageId,
  highlightQuery,
}: {
  role: 'worker' | 'clinic';
  conversationId: string;
  title: string;
  subtitle: string;
  scrollToMessageId?: string;
  highlightQuery?: string;
}) {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(conversationId);
  const [threadFocus, setThreadFocus] = useState<MessageThreadFocus | null>(
    scrollToMessageId || highlightQuery
      ? { scrollToMessageId, highlightQuery }
      : null,
  );
  const [inboxFilteredEmpty, setInboxFilteredEmpty] = useState(false);

  const handleInboxVisibilityChange = useCallback((state: { isFilteredEmpty: boolean }) => {
    setInboxFilteredEmpty(state.isFilteredEmpty);
  }, []);

  const inboxProps = {
    compact: true as const,
    scroll: false as const,
    fillsContainer: true as const,
    selectedConversationId: selectedId,
    onConversationSelect: (id: string, focus?: MessageThreadFocus) => {
      setSelectedId(id);
      setThreadFocus(focus ?? null);
    },
    onInboxVisibilityChange: handleInboxVisibilityChange,
  };

  const preview = { title, subtitle };

  const detail =
    !user?.id || inboxFilteredEmpty ? (
      <MessageThreadPlaceholder role={role} filteredEmpty={inboxFilteredEmpty} />
    ) : (
      <MessageThread
        embedded
        userId={user.id}
        role={role}
        conversationId={selectedId}
        title={title}
        subtitle={subtitle}
        scrollToMessageId={threadFocus?.scrollToMessageId}
        highlightQuery={threadFocus?.highlightQuery}
      />
    );

  return (
    <MasterDetailLayout
      masterWidth={MASTER_WIDTH}
      showDetail
      master={
        role === 'worker' ? (
          <WorkerMessagesMasterPane
            masterView="inbox"
            inboxProps={inboxProps}
            onConversationStarted={setSelectedId}
          />
        ) : (
          <ClinicMessagesInboxPanel {...inboxProps} />
        )
      }
      detail={detail}
      context={<MessageContextPanel preview={preview} role={role} />}
    />
  );
}
