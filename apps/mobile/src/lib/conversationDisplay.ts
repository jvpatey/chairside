import type { Conversation } from '@chairside/api';
import {
  formatApplicationStatus,
  formatClinicApplicationStatus,
  getRoleTypeLabel,
} from '@chairside/config';

import { formatShiftPostDateLabel, formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import { formatTimeRangePreview } from '@/lib/time';

export type ConversationDisplay = {
  contextLine: string;
  threadTitle: string;
  threadSubtitle: string;
  cardName: string;
  cardTitle: string;
  cardMeta: string;
};

function formatCardRole(conversation: Conversation): string {
  if (conversation.post_role_type) {
    return getRoleTypeLabel(conversation.post_role_type);
  }
  return conversation.post_type === 'shift' ? 'Fill-in' : 'Role';
}

function formatCardMeta(conversation: Conversation, role: 'worker' | 'clinic'): string {
  const statusLabel = formatStatusLabel(conversation, role);

  if (conversation.post_type === 'shift') {
    const dateLabel = conversation.shift_date
      ? formatShiftPostDateLabel(conversation.shift_date)
      : null;
    const hours =
      conversation.shift_start_time && conversation.shift_end_time
        ? formatTimeRangePreview(conversation.shift_start_time, conversation.shift_end_time)
        : null;
    return [dateLabel, hours, statusLabel].filter(Boolean).join(' · ');
  }

  return `${conversation.post_title} · ${statusLabel}`;
}

function formatStatusLabel(
  conversation: Conversation,
  role: 'worker' | 'clinic',
): string {
  if (role === 'clinic') {
    return formatClinicApplicationStatus(conversation.application_status);
  }
  return formatApplicationStatus(conversation.application_status, conversation.post_type);
}

function formatJobContext(conversation: Conversation, role: 'worker' | 'clinic'): string {
  const roleLabel = conversation.post_role_type
    ? getRoleTypeLabel(conversation.post_role_type)
    : 'Role';
  const statusLabel = formatStatusLabel(conversation, role);
  return `${roleLabel} · ${conversation.post_title} · ${statusLabel}`;
}

function formatShiftContext(conversation: Conversation, role: 'worker' | 'clinic'): string {
  const roleLabel = conversation.post_role_type
    ? getRoleTypeLabel(conversation.post_role_type)
    : 'Fill-in';
  const dateLabel = conversation.shift_date
    ? formatShiftPostDateLabel(conversation.shift_date)
    : 'Fill-in';
  const hours =
    conversation.shift_start_time && conversation.shift_end_time
      ? formatTimeRangePreview(conversation.shift_start_time, conversation.shift_end_time)
      : null;
  const statusLabel = formatStatusLabel(conversation, role);
  const datePart = hours ? `${dateLabel} · ${hours}` : dateLabel;
  return `${roleLabel} · ${datePart} · ${statusLabel}`;
}

export function formatConversationDisplay(
  conversation: Conversation,
  role: 'worker' | 'clinic',
): ConversationDisplay {
  const contextLine =
    conversation.post_type === 'shift'
      ? formatShiftContext(conversation, role)
      : formatJobContext(conversation, role);

  return {
    contextLine,
    threadTitle: conversation.counterpart_name,
    threadSubtitle: contextLine,
    cardName: conversation.counterpart_name,
    cardTitle: formatCardRole(conversation),
    cardMeta: formatCardMeta(conversation, role),
  };
}

/** Route params for message thread navigation. */
export function getMessageThreadPreview(
  conversation: Conversation,
  role: 'worker' | 'clinic',
): { title: string; subtitle: string } {
  const display = formatConversationDisplay(conversation, role);
  return {
    title: display.threadTitle,
    subtitle: display.threadSubtitle,
  };
}

/** Compact meta for shift conversations when only date/hours are needed. */
export function formatConversationShiftMeta(
  conversation: Pick<
    Conversation,
    'shift_date' | 'shift_start_time' | 'shift_end_time'
  >,
): string | null {
  if (!conversation.shift_date) return null;
  return formatShiftPostMeta({
    shift_date: conversation.shift_date,
    start_time: conversation.shift_start_time ?? '',
    end_time: conversation.shift_end_time ?? '',
  });
}
