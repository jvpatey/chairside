import type { Conversation } from '@chairside/api';
import { describe, expect, it } from 'vitest';

import { formatConversationDisplay } from '@/lib/conversationDisplay';

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'conversation-1',
    counterpart_name: 'Jeffrey Patey',
    counterpart_logo_storage_path: null,
    counterpart_account_deleted: false,
    conversation_type: 'application',
    post_type: 'shift',
    post_title: null,
    post_role_type: 'dental_hygienist',
    shift_date: '2026-06-14',
    shift_start_time: '07:00',
    shift_end_time: '17:00',
    application_status: 'pending',
    last_message_preview: 'Yeah sure i will take it',
    last_message_at: '2026-06-14T12:00:00.000Z',
    unread: false,
    ...overrides,
  } as Conversation;
}

describe('formatConversationDisplay', () => {
  it('builds a single inbox context line for shift conversations', () => {
    const display = formatConversationDisplay(makeConversation(), 'clinic');
    expect(display.inboxContextLine).toContain('Dental Hygienist');
    expect(display.inboxContextLine).toContain('Jun 14');
    expect(display.inboxContextLine).toContain('7 AM');
    expect(display.inboxContextLine).not.toContain('FILL-IN');
  });

  it('builds outreach context without duplicating outreach labels', () => {
    const display = formatConversationDisplay(
      makeConversation({
        conversation_type: 'outreach',
        application_status: null,
      }),
      'clinic',
    );
    expect(display.inboxContextLine).toMatch(/Fill-in|Dental hygienist/i);
    expect(display.inboxContextLine).toContain('Direct outreach');
    expect(display.inboxContextLine.split(' · ')).not.toContain('Fill-in outreach');
  });

  it('uses general inquiry copy for general conversations', () => {
    const display = formatConversationDisplay(
      makeConversation({
        conversation_type: 'general',
        post_type: null,
        post_role_type: null,
        shift_date: null,
        shift_start_time: null,
        shift_end_time: null,
        application_status: null,
      }),
      'clinic',
    );
    expect(display.inboxContextLine).toBe('General inquiry');
  });
});
