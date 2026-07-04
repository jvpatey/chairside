import type { Conversation } from '@chairside/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { ClinicMessagesInboxPanel } from '@/components/messaging/ClinicMessagesInboxPanel';
import { MessageContextPanel } from '@/components/messaging/MessageContextPanel.web';
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
      showContextDetails={false}
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

  const conversationIds = useMemo(
    () => conversations.map((conversation) => conversation.id),
    [conversations],
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedId(null);
        setThreadFocus(null);
        return;
      }

      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      if (conversationIds.length === 0) return;

      event.preventDefault();
      const currentIndex = selectedId ? conversationIds.indexOf(selectedId) : -1;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = Math.min(
        conversationIds.length - 1,
        Math.max(0, currentIndex + delta),
      );
      const nextId = conversationIds[nextIndex];
      if (nextId) {
        setSelectedId(nextId);
        setThreadFocus(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [conversationIds, selectedId]);

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
      context={<MessageContextPanel conversation={selectedConversation} role={role} />}
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
  const [conversations, setConversations] = useState<Conversation[]>([]);

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
    onConversationsChange: setConversations,
    onInboxVisibilityChange: handleInboxVisibilityChange,
  };

  const selectedConversation = conversations.find((row) => row.id === selectedId) ?? null;

  const detail =
    !user?.id || inboxFilteredEmpty ? (
      <MessageThreadPlaceholder role={role} filteredEmpty={inboxFilteredEmpty} />
    ) : (
      <MessageThread
        embedded
        showContextDetails={false}
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
      context={<MessageContextPanel conversation={selectedConversation} role={role} />}
    />
  );
}
