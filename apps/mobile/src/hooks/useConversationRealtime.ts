import { getSupabaseClient } from '@chairside/api';
import { useEffect, useRef } from 'react';

import type { ConversationRealtimeUpdate } from '@/lib/conversationRealtime';

export type { ConversationRealtimeUpdate } from '@/lib/conversationRealtime';

/** Subscribes to conversation row updates for read receipts and preview metadata. */
export function useConversationRealtime(
  conversationId: string | null,
  onUpdate: (update: ConversationRealtimeUpdate) => void,
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!conversationId) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          onUpdateRef.current(payload.new as ConversationRealtimeUpdate);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);
}

/** Subscribes to all conversation updates for the current user's inbox. */
export function useInboxConversationRealtime(
  userId: string | undefined,
  role: 'worker' | 'clinic',
  onUpdate: (update: ConversationRealtimeUpdate) => void,
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseClient();
    const filterColumn = role === 'worker' ? 'worker_id' : 'clinic_id';
    const channel = supabase
      .channel(`inbox-conversations:${role}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `${filterColumn}=eq.${userId}`,
        },
        (payload) => {
          onUpdateRef.current(payload.new as ConversationRealtimeUpdate);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [role, userId]);
}
