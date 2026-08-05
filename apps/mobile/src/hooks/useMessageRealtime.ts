import { getSupabaseClient, type Message } from '@chairside/api';
import { useEffect, useRef } from 'react';

let channelInstance = 0;

export function useMessageRealtime(
  conversationId: string | null,
  onMessage: (message: Message) => void,
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!conversationId) return;

    const supabase = getSupabaseClient();
    const instanceId = ++channelInstance;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(`messages:${conversationId}:${instanceId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            onMessageRef.current(payload.new as Message);
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
  }, [conversationId]);
}
