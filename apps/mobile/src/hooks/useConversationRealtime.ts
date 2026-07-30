import { getSupabaseClient } from '@chairside/api';
import { useEffect, useRef } from 'react';

import type { ConversationRealtimeUpdate } from '@/lib/conversationRealtime';

export type { ConversationRealtimeUpdate } from '@/lib/conversationRealtime';

let channelInstance = 0;

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
    const instanceId = ++channelInstance;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(`conversation:${conversationId}:${instanceId}`)
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
    } catch {
      if (channel) void supabase.removeChannel(channel);
      return;
    }

    return () => {
      if (channel) void supabase.removeChannel(channel);
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
    const instanceId = ++channelInstance;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(`inbox-conversations:${role}:${userId}:${instanceId}`)
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
    } catch {
      if (channel) void supabase.removeChannel(channel);
      return;
    }

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [role, userId]);
}
