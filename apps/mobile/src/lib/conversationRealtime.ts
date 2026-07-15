import type { Conversation, ConversationRow } from '@chairside/api';

export type ConversationRealtimeUpdate = Pick<
  ConversationRow,
  | 'id'
  | 'last_message_at'
  | 'last_message_preview'
  | 'last_sender_id'
  | 'worker_last_read_at'
  | 'clinic_last_read_at'
  | 'messaging_closed_at'
>;

export function patchConversationFromRealtimeUpdate(
  conversation: Conversation,
  update: ConversationRealtimeUpdate,
  viewerId: string,
  role: 'worker' | 'clinic',
): Conversation {
  const lastReadAt =
    role === 'worker' ? update.worker_last_read_at : update.clinic_last_read_at;
  const lastSenderIsOwnSide =
    role === 'clinic'
      ? Boolean(update.last_sender_id && update.last_sender_id !== conversation.worker_id)
      : update.last_sender_id === viewerId;
  const unread = Boolean(
    update.last_message_at &&
      !lastSenderIsOwnSide &&
      (!lastReadAt || new Date(update.last_message_at).getTime() > new Date(lastReadAt).getTime()),
  );

  return {
    ...conversation,
    last_message_at: update.last_message_at,
    last_message_preview: update.last_message_preview,
    last_sender_id: update.last_sender_id,
    worker_last_read_at: update.worker_last_read_at,
    clinic_last_read_at: update.clinic_last_read_at,
    messaging_closed_at: update.messaging_closed_at,
    unread,
  };
}
