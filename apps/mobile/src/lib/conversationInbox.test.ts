import type { Conversation } from '@chairside/api';
import { describe, expect, it } from 'vitest';

import {
  buildConversationInboxSections,
  buildGroupedConversationInboxList,
  getConversationCounterpartId,
} from '@/lib/conversationInbox';

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: overrides.id ?? 'conversation-1',
    worker_id: overrides.worker_id ?? 'worker-1',
    clinic_id: overrides.clinic_id ?? 'clinic-1',
    last_message_at: overrides.last_message_at ?? '2026-06-14T12:00:00.000Z',
    ...overrides,
  } as Conversation;
}

describe('getConversationCounterpartId', () => {
  it('uses worker id for clinic inbox rows', () => {
    expect(getConversationCounterpartId(makeConversation(), 'clinic')).toBe('worker-1');
  });

  it('uses clinic id for worker inbox rows', () => {
    expect(getConversationCounterpartId(makeConversation(), 'worker')).toBe('clinic-1');
  });
});

describe('buildGroupedConversationInboxList', () => {
  it('clusters threads from the same counterpart together', () => {
    const entries = buildGroupedConversationInboxList(
      [
        makeConversation({ id: 'a', worker_id: 'worker-1', last_message_at: '2026-06-10T12:00:00.000Z' }),
        makeConversation({ id: 'b', worker_id: 'worker-2', last_message_at: '2026-06-12T12:00:00.000Z' }),
        makeConversation({ id: 'c', worker_id: 'worker-1', last_message_at: '2026-06-14T12:00:00.000Z' }),
      ],
      'clinic',
    );

    expect(entries.map((entry) => entry.conversation.id)).toEqual(['c', 'a', 'b']);
    expect(entries[0]?.groupVariant).toBe('group-lead');
    expect(entries[1]?.groupVariant).toBe('group-thread');
    expect(entries[2]?.groupVariant).toBe('standalone');
  });

  it('skips grouping while search is active', () => {
    const conversations = [
      makeConversation({ id: 'a', worker_id: 'worker-1' }),
      makeConversation({ id: 'b', worker_id: 'worker-1' }),
    ];
    const entries = buildGroupedConversationInboxList(conversations, 'clinic', {
      groupEnabled: false,
    });
    expect(entries.every((entry) => entry.groupVariant === 'standalone')).toBe(true);
  });
});

describe('buildConversationInboxSections', () => {
  it('returns a group section for multiple threads with the same counterpart', () => {
    const sections = buildConversationInboxSections(
      [
        makeConversation({
          id: 'a',
          worker_id: 'worker-1',
          last_message_at: '2026-06-14T12:00:00.000Z',
        }),
        makeConversation({
          id: 'b',
          worker_id: 'worker-1',
          last_message_at: '2026-06-13T12:00:00.000Z',
        }),
        makeConversation({
          id: 'c',
          worker_id: 'worker-2',
          last_message_at: '2026-06-12T12:00:00.000Z',
        }),
      ],
      'clinic',
    );

    expect(sections).toHaveLength(2);
    expect(sections[0]?.kind).toBe('group');
    expect(sections[0]?.kind === 'group' && sections[0].threads.map((thread) => thread.id)).toEqual([
      'a',
      'b',
    ]);
    expect(sections[1]?.kind).toBe('standalone');
  });
});
