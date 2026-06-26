import { getSupabaseClient, type Message } from '@chairside/api';
import { useEffect, useRef } from 'react';

type InboxRealtimeMessage = Pick<
  Message,
  'id' | 'conversation_id' | 'sender_id' | 'body' | 'created_at'
>;

/**
 * Subscribes to message inserts for the current user and notifies when a
 * conversation row should be refreshed or patched.
 */
export function useInboxRealtime(
  userId: string | undefined,
  role: 'worker' | 'clinic',
  onMessage: (message: InboxRealtimeMessage) => void,
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`inbox:${role}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const message = payload.new as InboxRealtimeMessage;
          if (message.sender_id === userId) return;
          onMessageRef.current(message);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [role, userId]);
}
