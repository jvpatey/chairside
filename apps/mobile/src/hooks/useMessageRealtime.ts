import { getSupabaseClient, type Message } from '@chairside/api';
import { useEffect } from 'react';

export function useMessageRealtime(
  conversationId: string | null,
  onMessage: (message: Message) => void,
) {
  useEffect(() => {
    if (!conversationId) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onMessage(payload.new as Message);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, onMessage]);
}
