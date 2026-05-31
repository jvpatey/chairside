import type { Conversation } from '@chairside/api';

export type ConversationInboxFilter = 'all' | 'unread' | 'roles' | 'fill_ins' | 'general';

export const CONVERSATION_INBOX_FILTERS: { value: ConversationInboxFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'roles', label: 'Roles' },
  { value: 'fill_ins', label: 'Fill-ins' },
  { value: 'general', label: 'General' },
];

export type ConversationFilterCounts = Record<ConversationInboxFilter, number>;

export function matchesConversationFilter(
  conversation: Conversation,
  filter: ConversationInboxFilter,
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'unread':
      return conversation.unread;
    case 'roles':
      return conversation.conversation_type === 'application' && conversation.post_type === 'job';
    case 'fill_ins':
      return conversation.conversation_type === 'application' && conversation.post_type === 'shift';
    case 'general':
      return conversation.conversation_type === 'general';
    default:
      return true;
  }
}

export function filterConversations(
  conversations: Conversation[],
  filter: ConversationInboxFilter,
): Conversation[] {
  if (filter === 'all') return conversations;
  return conversations.filter((conversation) => matchesConversationFilter(conversation, filter));
}

export function getConversationFilterCounts(conversations: Conversation[]): ConversationFilterCounts {
  const counts: ConversationFilterCounts = {
    all: conversations.length,
    unread: 0,
    roles: 0,
    fill_ins: 0,
    general: 0,
  };

  for (const conversation of conversations) {
    if (conversation.unread) counts.unread += 1;
    if (matchesConversationFilter(conversation, 'roles')) counts.roles += 1;
    if (matchesConversationFilter(conversation, 'fill_ins')) counts.fill_ins += 1;
    if (matchesConversationFilter(conversation, 'general')) counts.general += 1;
  }

  return counts;
}

export function getConversationInboxEmptyMessage(
  filter: ConversationInboxFilter,
  role: 'worker' | 'clinic',
): string {
  if (filter === 'unread') {
    return 'No unread conversations.';
  }
  if (filter === 'roles') {
    return role === 'worker'
      ? 'No role application conversations yet.'
      : 'No role applicant conversations yet.';
  }
  if (filter === 'fill_ins') {
    return role === 'worker'
      ? 'No fill-in conversations yet.'
      : 'No fill-in applicant conversations yet.';
  }
  if (filter === 'general') {
    return role === 'worker'
      ? 'No general clinic inquiries yet. Use Message a clinic above to start one.'
      : 'No general candidate inquiries yet. Turn on general messages above to receive them.';
  }
  return role === 'worker'
    ? 'No conversations yet. Message a clinic from an application or use Message a clinic above.'
    : 'No conversations yet. Message an applicant from their application details, or turn on general candidate messages above.';
}
