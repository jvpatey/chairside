import { describe, expect, it } from 'vitest';

import {
  buildThreadListItems,
  findLatestMatchingMessageId,
  findThreadListIndexForMessage,
  formatMessageDateLabel,
  formatMessageSearchPreview,
  matchesConversationSearch,
  type ThreadMessage,
} from '@/lib/messageThreadDisplay';

function makeMessage(overrides: Partial<ThreadMessage>): ThreadMessage {
  return {
    id: overrides.id ?? 'message-1',
    conversation_id: 'conversation-1',
    sender_id: overrides.sender_id ?? 'worker-1',
    body: overrides.body ?? 'Hello',
    created_at: overrides.created_at ?? '2026-06-26T12:00:00.000Z',
    ...overrides,
  };
}

describe('formatMessageDateLabel', () => {
  it('labels same-day messages as Today', () => {
    const today = new Date();
    today.setHours(15, 0, 0, 0);
    expect(formatMessageDateLabel(today.toISOString())).toBe('Today');
  });
});

describe('buildThreadListItems', () => {
  it('inserts date separators and groups consecutive messages', () => {
    const items = buildThreadListItems(
      [
        makeMessage({ id: '1', created_at: '2026-06-26T12:00:00.000Z' }),
        makeMessage({ id: '2', created_at: '2026-06-26T12:02:00.000Z' }),
        makeMessage({
          id: '3',
          sender_id: 'clinic-1',
          created_at: '2026-06-26T12:05:00.000Z',
        }),
      ],
      'worker-1',
    );

    expect(items.filter((item) => item.type === 'date')).toHaveLength(1);
    const messageItems = items.filter((item) => item.type === 'message');
    expect(messageItems[0]?.type === 'message' && messageItems[0].groupedWithNext).toBe(true);
    expect(messageItems[1]?.type === 'message' && messageItems[1].groupedWithPrevious).toBe(true);
  });
});

describe('findLatestMatchingMessageId', () => {
  it('returns the newest message containing the query', () => {
    const id = findLatestMatchingMessageId(
      [
        { id: '1', body: 'Hello there' },
        { id: '2', body: 'Friday works for me' },
      ],
      'friday',
    );
    expect(id).toBe('2');
  });
});

describe('findThreadListIndexForMessage', () => {
  it('finds the flat list index for a message row', () => {
    const items = buildThreadListItems(
      [
        makeMessage({ id: '1', created_at: '2026-06-26T12:00:00.000Z' }),
        makeMessage({ id: '2', created_at: '2026-06-26T12:05:00.000Z' }),
      ],
      'worker-1',
    );
    expect(findThreadListIndexForMessage(items, '2')).toBeGreaterThan(0);
  });
});

describe('formatMessageSearchPreview', () => {
  it('truncates long matching message bodies', () => {
    const body = 'a'.repeat(150);
    expect(formatMessageSearchPreview(body, '', 120)).toMatch(/…$/);
    expect(formatMessageSearchPreview(body, '', 120).length).toBeLessThanOrEqual(121);
  });

  it('always keeps the full query match inside the preview snippet', () => {
    const body =
      'Prefix padding before the important Friday availability note and more trailing text here.';
    const preview = formatMessageSearchPreview(body, 'Friday availability', 80);
    expect(preview.toLowerCase()).toContain('friday availability');
  });

  it('centers the snippet around the query match', () => {
    const body =
      'Prefix padding before the important Friday availability note and more trailing text here.';
    const preview = formatMessageSearchPreview(body, 'Friday', 60);
    expect(preview.toLowerCase()).toContain('friday');
    expect(preview.startsWith('…') || preview.includes('Friday')).toBe(true);
  });
});

describe('matchesConversationSearch', () => {
  it('matches counterpart name and preview text', () => {
    expect(
      matchesConversationSearch(
        {
          counterpart_name: 'Smile Dental',
          last_message_preview: 'Can you cover Friday?',
          post_title: 'Hygienist',
        },
        'friday',
      ),
    ).toBe(true);
    expect(
      matchesConversationSearch(
        {
          counterpart_name: 'Smile Dental',
          last_message_preview: 'Can you cover Friday?',
          post_title: 'Hygienist',
        },
        'ortho',
      ),
    ).toBe(false);
  });
});
