import { describe, expect, it } from 'vitest';

import { patchConversationFromRealtimeUpdate } from '@/lib/conversationRealtime';
import type { Conversation } from '@chairside/api';

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
    worker_last_read_at: '2026-06-26T11:00:00.000Z',
    clinic_last_read_at: null,
    last_message_at: '2026-06-26T12:00:00.000Z',
    last_message_preview: 'Hello',
    last_sender_id: 'clinic-1',
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
    unread: true,
    can_send: true,
    ...overrides,
  };
}

describe('patchConversationFromRealtimeUpdate', () => {
  it('recomputes unread when counterpart sends a newer message', () => {
    const patched = patchConversationFromRealtimeUpdate(
      makeConversation({ unread: false }),
      {
        id: 'conversation-1',
        last_message_at: '2026-06-26T13:00:00.000Z',
        last_message_preview: 'New reply',
        last_sender_id: 'clinic-1',
        worker_last_read_at: '2026-06-26T11:00:00.000Z',
        clinic_last_read_at: '2026-06-26T13:00:00.000Z',
        messaging_closed_at: null,
      },
      'worker-1',
      'worker',
    );

    expect(patched.unread).toBe(true);
    expect(patched.last_message_preview).toBe('New reply');
  });

  it('clears unread when the viewer sent the latest message', () => {
    const patched = patchConversationFromRealtimeUpdate(
      makeConversation({ unread: true }),
      {
        id: 'conversation-1',
        last_message_at: '2026-06-26T13:00:00.000Z',
        last_message_preview: 'My reply',
        last_sender_id: 'worker-1',
        worker_last_read_at: '2026-06-26T13:00:00.000Z',
        clinic_last_read_at: null,
        messaging_closed_at: null,
      },
      'worker-1',
      'worker',
    );

    expect(patched.unread).toBe(false);
  });
});
