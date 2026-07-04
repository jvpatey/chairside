import { describe, expect, it } from 'vitest';

import {
  buildThreadListItems,
  findLatestMatchingMessageId,
  findThreadListIndexForMessage,
  formatInboxPreviewText,
  formatMessageDateLabel,
  formatMessageSearchPreview,
  getLastOwnMessageDeliveryStatus,
  matchesConversationSearch,
  type ThreadMessage,
} from '@/lib/messageThreadDisplay';
import type { Conversation } from '@chairside/api';

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

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'conversation-1',
    application_id: null,
    conversation_type: 'general',
    outreach_role_type: null,
    outreach_shift_date: null,
    outreach_start_time: null,
    outreach_end_time: null,
    worker_id: 'worker-1',
    clinic_id: 'clinic-1',
    worker_last_read_at: null,
    clinic_last_read_at: null,
    last_message_at: '2026-06-26T12:00:00.000Z',
    last_message_preview: 'Hello there',
    last_sender_id: 'worker-1',
    messaging_closed_at: null,
    worker_hidden_at: null,
    clinic_hidden_at: null,
    worker_account_deleted_at: null,
    clinic_account_deleted_at: null,
    created_at: '2026-06-20T12:00:00.000Z',
    updated_at: '2026-06-26T12:00:00.000Z',
    application_status: null,
    post_title: null,
    post_type: null,
    post_role_type: null,
    shift_date: null,
    shift_start_time: null,
    shift_end_time: null,
    counterpart_name: 'Dental Clinic',
    counterpart_logo_storage_path: null,
    counterpart_account_deleted: false,
    unread: false,
    can_send: true,
    ...overrides,
  };
}

describe('formatInboxPreviewText', () => {
  it('prefixes own last messages with You:', () => {
    const preview = formatInboxPreviewText(
      makeConversation({ last_sender_id: 'worker-1', last_message_preview: 'Sounds good' }),
      'worker-1',
    );
    expect(preview).toBe('You: Sounds good');
  });
});

describe('getLastOwnMessageDeliveryStatus', () => {
  it('returns read when counterpart read cursor is after the message', () => {
    const status = getLastOwnMessageDeliveryStatus(
      makeConversation({
        last_message_at: '2026-06-26T12:00:00.000Z',
        last_sender_id: 'worker-1',
        clinic_last_read_at: '2026-06-26T12:05:00.000Z',
      }),
      'worker',
      'worker-1',
    );
    expect(status).toBe('read');
  });

  it('returns delivered when counterpart has not read yet', () => {
    const status = getLastOwnMessageDeliveryStatus(
      makeConversation({
        last_message_at: '2026-06-26T12:00:00.000Z',
        last_sender_id: 'worker-1',
        clinic_last_read_at: null,
      }),
      'worker',
      'worker-1',
    );
    expect(status).toBe('delivered');
  });
});
