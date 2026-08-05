import { getSupabaseClient, type Message } from '@chairside/api';
import { useEffect, useRef } from 'react';

type InboxRealtimeMessage = Pick<
  Message,
  'id' | 'conversation_id' | 'sender_id' | 'body' | 'created_at'
>;

let channelInstance = 0;

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
    const instanceId = ++channelInstance;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(`inbox:${role}:${userId}:${instanceId}`)
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
    } catch {
      if (channel) void supabase.removeChannel(channel);
      return;
    }

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [role, userId]);
}
