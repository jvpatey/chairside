import type { Conversation, Message, MessageDeliveryStatus } from '@chairside/api';

export type ThreadMessageStatus = 'sent' | 'pending' | 'failed';

export type ThreadMessage = Message & {
  clientStatus?: ThreadMessageStatus;
};

export type ThreadListItem =
  | { type: 'date'; id: string; label: string }
  | {
      type: 'message';
      id: string;
      message: ThreadMessage;
      isOwn: boolean;
      showTimestamp: boolean;
      groupedWithPrevious: boolean;
      groupedWithNext: boolean;
    };

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export const MESSAGE_BUBBLE_RADIUS_LARGE = 18;
export const MESSAGE_BUBBLE_RADIUS_JOINT = 5;

/** iMessage-style corner radii for grouped consecutive bubbles. */
export function getMessageBubbleRadii(
  isOwn: boolean,
  groupedWithPrevious: boolean,
  groupedWithNext: boolean,
): {
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
  borderBottomLeftRadius: number;
  borderBottomRightRadius: number;
} {
  const large = MESSAGE_BUBBLE_RADIUS_LARGE;
  const joint = MESSAGE_BUBBLE_RADIUS_JOINT;

  if (isOwn) {
    return {
      borderTopLeftRadius: large,
      borderTopRightRadius: groupedWithPrevious ? joint : large,
      borderBottomLeftRadius: large,
      borderBottomRightRadius: groupedWithNext ? joint : large,
    };
  }

  return {
    borderTopLeftRadius: groupedWithPrevious ? joint : large,
    borderTopRightRadius: large,
    borderBottomLeftRadius: groupedWithNext ? joint : large,
    borderBottomRightRadius: large,
  };
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Calendar label for a message day boundary. */
export function formatMessageDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const startOfToday = startOfDay(now);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export type ThreadSideOptions = {
  role?: 'worker' | 'clinic';
  /** Candidate id — required for clinic shared-inbox side detection. */
  workerId?: string | null;
};

/** Whether this sender is on the viewer's side of a shared clinic inbox thread. */
export function isOwnSideMessage(
  senderId: string,
  viewerId: string,
  options?: ThreadSideOptions,
): boolean {
  if (options?.role === 'clinic' && options.workerId) {
    return senderId !== options.workerId;
  }
  return senderId === viewerId;
}

function isSameSenderGroup(
  previous: ThreadMessage,
  next: ThreadMessage,
  viewerId: string,
  options?: ThreadSideOptions,
): boolean {
  const previousOwn = isOwnSideMessage(previous.sender_id, viewerId, options);
  const nextOwn = isOwnSideMessage(next.sender_id, viewerId, options);
  if (previousOwn !== nextOwn) return false;

  const previousDate = new Date(previous.created_at);
  const nextDate = new Date(next.created_at);
  if (Number.isNaN(previousDate.getTime()) || Number.isNaN(nextDate.getTime())) {
    return false;
  }

  if (startOfDay(previousDate).getTime() !== startOfDay(nextDate).getTime()) {
    return false;
  }

  return Math.abs(nextDate.getTime() - previousDate.getTime()) <= GROUP_WINDOW_MS;
}

/** Whether two adjacent thread messages should share a visual bubble group. */
export function areThreadMessagesGrouped(
  previous: ThreadMessage,
  next: ThreadMessage,
  viewerId: string,
  options?: ThreadSideOptions,
): boolean {
  return isSameSenderGroup(previous, next, viewerId, options);
}

/** Flatten messages into date separators and grouped bubble rows. */
export function buildThreadListItems(
  messages: ThreadMessage[],
  viewerId: string,
  options?: ThreadSideOptions,
): ThreadListItem[] {
  if (messages.length === 0) return [];

  const items: ThreadListItem[] = [];
  let lastDateLabel: string | null = null;

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index]!;
    const dateLabel = formatMessageDateLabel(message.created_at);

    if (dateLabel && dateLabel !== lastDateLabel) {
      items.push({ type: 'date', id: `date-${message.created_at}`, label: dateLabel });
      lastDateLabel = dateLabel;
    }

    const previous = index > 0 ? messages[index - 1] : null;
    const next = index < messages.length - 1 ? messages[index + 1] : null;
    const groupedWithPrevious = previous
      ? isSameSenderGroup(previous, message, viewerId, options)
      : false;
    const groupedWithNext = next
      ? isSameSenderGroup(message, next, viewerId, options)
      : false;
    const isOwn = isOwnSideMessage(message.sender_id, viewerId, options);

    items.push({
      type: 'message',
      id: message.id,
      message,
      isOwn,
      showTimestamp: !groupedWithNext,
      groupedWithPrevious,
      groupedWithNext,
    });
  }

  return items;
}

export function createPendingMessage(
  conversationId: string,
  senderId: string,
  body: string,
): ThreadMessage {
  return {
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversation_id: conversationId,
    sender_id: senderId,
    body,
    created_at: new Date().toISOString(),
    clientStatus: 'pending',
  };
}

export function matchesConversationSearch(conversation: {
  counterpart_name: string;
  last_message_preview: string | null;
  post_title: string | null;
}, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    conversation.counterpart_name,
    conversation.last_message_preview,
    conversation.post_title,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalized);
}

/** Find the newest loaded message whose body contains the query. */
export function findLatestMatchingMessageId(
  messages: { id: string; body: string }[],
  query: string,
): string | undefined {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return undefined;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]!;
    if (message.body.toLowerCase().includes(normalized)) {
      return message.id;
    }
  }
  return undefined;
}

export function findThreadListIndexForMessage(
  listItems: ThreadListItem[],
  messageId: string,
): number {
  return listItems.findIndex(
    (item) => item.type === 'message' && item.message.id === messageId,
  );
}
export function getLastOwnMessageDeliveryStatus(
  conversation: Conversation,
  role: 'worker' | 'clinic',
  viewerId: string,
): MessageDeliveryStatus | null {
  if (
    !conversation.last_message_at ||
    !conversation.last_sender_id ||
    !isOwnSideMessage(conversation.last_sender_id, viewerId, {
      role,
      workerId: conversation.worker_id,
    })
  ) {
    return null;
  }

  const counterpartLastReadAt =
    role === 'worker' ? conversation.clinic_last_read_at : conversation.worker_last_read_at;
  if (
    counterpartLastReadAt &&
    new Date(conversation.last_message_at).getTime() <= new Date(counterpartLastReadAt).getTime()
  ) {
    return 'read';
  }

  return 'delivered';
}

export function formatInboxPreviewText(
  conversation: Conversation,
  viewerId: string,
  options?: ThreadSideOptions,
): string {
  const preview = conversation.last_message_preview ?? 'No messages yet';
  if (preview === 'No messages yet') return preview;
  if (
    conversation.last_sender_id &&
    isOwnSideMessage(conversation.last_sender_id, viewerId, options)
  ) {
    return `You: ${preview}`;
  }
  return preview;
}

export function formatMessageSearchPreview(
  body: string,
  query: string,
  maxLength = 160,
): string {
  const trimmed = body.trim();
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    if (trimmed.length <= maxLength) return trimmed;
    return `${trimmed.slice(0, maxLength).trim()}…`;
  }

  const lowerBody = trimmed.toLowerCase();
  const matchIndex = lowerBody.indexOf(normalizedQuery);
  if (matchIndex === -1) {
    if (trimmed.length <= maxLength) return trimmed;
    return `${trimmed.slice(0, maxLength).trim()}…`;
  }

  const matchLength = normalizedQuery.length;
  const minVisibleLength = matchLength + 32;
  const effectiveMax = Math.max(maxLength, minVisibleLength);
  const contextBudget = Math.max(effectiveMax - matchLength, 32);
  const leading = Math.floor(contextBudget / 2);
  let start = Math.max(0, matchIndex - leading);
  let end = Math.min(trimmed.length, start + effectiveMax);

  if (end - start < effectiveMax) {
    start = Math.max(0, end - effectiveMax);
  }

  // Guarantee the full match stays inside the snippet window.
  if (matchIndex < start) {
    start = matchIndex;
    end = Math.min(trimmed.length, start + effectiveMax);
  } else if (matchIndex + matchLength > end) {
    end = matchIndex + matchLength;
    start = Math.max(0, end - effectiveMax);
  }

  let snippet = trimmed.slice(start, end).trim();
  if (start > 0) snippet = `…${snippet}`;
  if (end < trimmed.length) snippet = `${snippet}…`;
  return snippet;
}
