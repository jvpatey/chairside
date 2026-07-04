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
      return (
        (conversation.conversation_type === 'application' && conversation.post_type === 'shift') ||
        conversation.conversation_type === 'outreach'
      );
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

export function getConversationFilterCounts(
  conversations: Conversation[],
): ConversationFilterCounts {
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
      : 'No direct inquiries yet. Turn on letting candidates message you above to receive them.';
  }
  return role === 'worker'
    ? 'No conversations yet. Message a clinic from an application or use Message a clinic above.'
    : 'No conversations yet. Message an applicant from their application details, or turn on letting candidates message you above.';
}

export type ConversationInboxGroupVariant = 'standalone' | 'group-lead' | 'group-thread';

export type ConversationInboxListEntry = {
  conversation: Conversation;
  groupVariant: ConversationInboxGroupVariant;
  groupThreadCount?: number;
};

export function getConversationCounterpartId(
  conversation: Conversation,
  role: 'worker' | 'clinic',
): string {
  return role === 'clinic' ? conversation.worker_id : conversation.clinic_id;
}

function conversationRecency(conversation: Conversation): number {
  return conversation.last_message_at ? new Date(conversation.last_message_at).getTime() : 0;
}

/** Cluster threads with the same counterpart; groups ordered by latest activity. */
export function buildGroupedConversationInboxList(
  conversations: Conversation[],
  role: 'worker' | 'clinic',
  options?: { groupEnabled?: boolean },
): ConversationInboxListEntry[] {
  const groupEnabled = options?.groupEnabled ?? true;
  if (!groupEnabled || conversations.length === 0) {
    return conversations.map((conversation) => ({
      conversation,
      groupVariant: 'standalone' as const,
    }));
  }

  const byCounterpart = new Map<string, Conversation[]>();
  for (const conversation of conversations) {
    const key = getConversationCounterpartId(conversation, role);
    const bucket = byCounterpart.get(key) ?? [];
    bucket.push(conversation);
    byCounterpart.set(key, bucket);
  }

  const groups = [...byCounterpart.entries()].map(([counterpartId, items]) => ({
    counterpartId,
    items: [...items].sort((a, b) => conversationRecency(b) - conversationRecency(a)),
    latestRecency: Math.max(...items.map(conversationRecency)),
  }));

  groups.sort((a, b) => b.latestRecency - a.latestRecency);

  const entries: ConversationInboxListEntry[] = [];
  for (const group of groups) {
    if (group.items.length === 1) {
      entries.push({
        conversation: group.items[0]!,
        groupVariant: 'standalone',
      });
      continue;
    }

    group.items.forEach((conversation, index) => {
      entries.push({
        conversation,
        groupVariant: index === 0 ? 'group-lead' : 'group-thread',
        groupThreadCount: group.items.length,
      });
    });
  }

  return entries;
}

export type ConversationInboxSection =
  | { kind: 'standalone'; conversation: Conversation }
  | { kind: 'group'; threads: Conversation[] };

export function buildConversationInboxSections(
  conversations: Conversation[],
  role: 'worker' | 'clinic',
  options?: { groupEnabled?: boolean },
): ConversationInboxSection[] {
  const entries = buildGroupedConversationInboxList(conversations, role, options);
  const sections: ConversationInboxSection[] = [];
  let index = 0;

  while (index < entries.length) {
    const entry = entries[index]!;
    if (entry.groupVariant === 'group-lead') {
      const threads = [entry.conversation];
      index += 1;
      while (index < entries.length && entries[index]?.groupVariant === 'group-thread') {
        threads.push(entries[index]!.conversation);
        index += 1;
      }
      sections.push({ kind: 'group', threads });
      continue;
    }

    sections.push({ kind: 'standalone', conversation: entry.conversation });
    index += 1;
  }

  return sections;
}
