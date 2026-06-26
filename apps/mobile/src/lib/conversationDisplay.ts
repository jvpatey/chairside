import type { Conversation } from '@chairside/api';
import {
  formatApplicationStatus,
  formatClinicApplicationStatus,
  getRoleTypeLabel,
  SPECIALTY_OPTIONS,
} from '@chairside/config';

import { addDays, isSameDay, parseISODate, startOfDay } from '@/lib/dates';
import { formatShiftPostDateLabel, formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import { formatTimeRangePreview } from '@/lib/time';

export type ConversationDisplay = {
  contextLine: string;
  threadTitle: string;
  threadSubtitle: string;
  cardName: string;
  cardTitle: string;
  cardMeta: string;
  /** Single inbox context line (role · date · status) — replaces separate eyebrow + meta. */
  inboxContextLine: string;
};

function formatSpecialtyLabel(specialty: string | null | undefined): string | null {
  if (!specialty) return null;
  return SPECIALTY_OPTIONS.find((option) => option.value === specialty)?.label ?? null;
}

function formatCardRole(conversation: Conversation): string {
  if (conversation.conversation_type === 'general') {
    return 'General inquiry';
  }
  if (conversation.conversation_type === 'outreach') {
    return 'Fill-in outreach';
  }

  if (conversation.post_role_type) {
    return getRoleTypeLabel(conversation.post_role_type);
  }
  return conversation.post_type === 'shift' ? 'Fill-in' : 'Role';
}

function formatInboxShortShiftDate(shiftDate: string): string {
  const date = parseISODate(shiftDate);
  if (!date) return shiftDate;

  const today = startOfDay(new Date());
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, addDays(today, 1))) return 'Tomorrow';

  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

function formatInboxShiftParts(conversation: Conversation): string[] {
  const parts: string[] = [];
  if (conversation.shift_date) {
    parts.push(formatInboxShortShiftDate(conversation.shift_date));
  }
  if (conversation.shift_start_time && conversation.shift_end_time) {
    parts.push(
      formatTimeRangePreview(conversation.shift_start_time, conversation.shift_end_time),
    );
  }
  return parts;
}

function formatInboxContextLine(conversation: Conversation, role: 'worker' | 'clinic'): string {
  const deletedNote = conversation.counterpart_account_deleted ? 'No longer on Chairside' : null;

  if (conversation.conversation_type === 'general') {
    const base =
      role === 'worker' ? 'General inquiry · Reach out without applying' : 'General inquiry';
    return [base, deletedNote].filter(Boolean).join(' · ');
  }

  if (conversation.conversation_type === 'outreach') {
    const roleLabel = conversation.post_role_type
      ? getRoleTypeLabel(conversation.post_role_type)
      : 'Fill-in';
    const suffix = role === 'worker' ? 'Fill-in request' : 'Direct outreach';
    return [roleLabel, ...formatInboxShiftParts(conversation), suffix, deletedNote]
      .filter(Boolean)
      .join(' · ');
  }

  const roleLabel = formatCardRole(conversation);
  const statusLabel = formatStatusLabel(conversation, role);

  if (conversation.post_type === 'shift') {
    return [roleLabel, ...formatInboxShiftParts(conversation), statusLabel, deletedNote]
      .filter(Boolean)
      .join(' · ');
  }

  return [roleLabel, conversation.post_title, statusLabel, deletedNote]
    .filter(Boolean)
    .join(' · ');
}

function formatCardMeta(conversation: Conversation, role: 'worker' | 'clinic'): string {
  const deletedNote = conversation.counterpart_account_deleted ? 'No longer on Chairside' : null;

  if (conversation.conversation_type === 'general') {
    const base = role === 'worker' ? 'Reach out without applying' : null;
    return [base, deletedNote].filter(Boolean).join(' · ');
  }

  if (conversation.conversation_type === 'outreach') {
    const dateLabel = conversation.shift_date
      ? formatShiftPostDateLabel(conversation.shift_date)
      : null;
    const hours =
      conversation.shift_start_time && conversation.shift_end_time
        ? formatTimeRangePreview(conversation.shift_start_time, conversation.shift_end_time)
        : null;
    const base = role === 'worker' ? 'Clinic fill-in request' : 'Direct outreach';
    return [dateLabel, hours, base, deletedNote].filter(Boolean).join(' · ');
  }

  const statusLabel = formatStatusLabel(conversation, role);

  if (conversation.post_type === 'shift') {
    const dateLabel = conversation.shift_date
      ? formatShiftPostDateLabel(conversation.shift_date)
      : null;
    const hours =
      conversation.shift_start_time && conversation.shift_end_time
        ? formatTimeRangePreview(conversation.shift_start_time, conversation.shift_end_time)
        : null;
    return [dateLabel, hours, statusLabel, deletedNote].filter(Boolean).join(' · ');
  }

  return [conversation.post_title, statusLabel, deletedNote].filter(Boolean).join(' · ');
}

function formatStatusLabel(conversation: Conversation, role: 'worker' | 'clinic'): string {
  if (!conversation.application_status) return '';

  if (role === 'clinic') {
    return formatClinicApplicationStatus(conversation.application_status);
  }
  return formatApplicationStatus(conversation.application_status, conversation.post_type ?? 'job');
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

function formatOutreachContext(conversation: Conversation, role: 'worker' | 'clinic'): string {
  if (!conversation.shift_date) {
    return role === 'worker' ? 'Fill-in request' : 'Fill-in outreach';
  }

  const roleLabel = conversation.post_role_type
    ? getRoleTypeLabel(conversation.post_role_type)
    : 'Fill-in';
  const dateLabel = formatShiftPostDateLabel(conversation.shift_date);
  const hours =
    conversation.shift_start_time && conversation.shift_end_time
      ? formatTimeRangePreview(conversation.shift_start_time, conversation.shift_end_time)
      : null;
  const datePart = hours ? `${dateLabel} · ${hours}` : dateLabel;
  const suffix = role === 'worker' ? 'Fill-in request' : 'Outreach inquiry';
  return `${roleLabel} · ${datePart} · ${suffix}`;
}

export function formatConversationDisplay(
  conversation: Conversation,
  role: 'worker' | 'clinic',
): ConversationDisplay {
  const inboxContextLine = formatInboxContextLine(conversation, role);

  if (conversation.conversation_type === 'general') {
    return {
      contextLine: 'General inquiry',
      threadTitle: conversation.counterpart_name,
      threadSubtitle: 'General inquiry',
      cardName: conversation.counterpart_name,
      cardTitle: 'General inquiry',
      cardMeta: formatCardMeta(conversation, role),
      inboxContextLine,
    };
  }

  if (conversation.conversation_type === 'outreach') {
    const contextLine = formatOutreachContext(conversation, role);
    return {
      contextLine,
      threadTitle: conversation.counterpart_name,
      threadSubtitle: contextLine,
      cardName: conversation.counterpart_name,
      cardTitle: formatCardRole(conversation),
      cardMeta: formatCardMeta(conversation, role),
      inboxContextLine,
    };
  }

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
    inboxContextLine,
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
  conversation: Pick<Conversation, 'shift_date' | 'shift_start_time' | 'shift_end_time'>,
): string | null {
  if (!conversation.shift_date) return null;
  return formatShiftPostMeta({
    shift_date: conversation.shift_date,
    start_time: conversation.shift_start_time ?? '',
    end_time: conversation.shift_end_time ?? '',
  });
}

export function formatMessageableClinicMeta(clinic: {
  city: string | null;
  province: string;
  specialty: string;
}): string {
  const specialtyLabel = formatSpecialtyLabel(clinic.specialty);
  const location = [clinic.city, clinic.province].filter(Boolean).join(', ');
  return [location, specialtyLabel].filter(Boolean).join(' · ');
}
