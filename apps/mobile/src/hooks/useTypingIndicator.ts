import { getSupabaseClient } from '@chairside/api';
import { useCallback, useEffect, useRef, useState } from 'react';

const TYPING_HEARTBEAT_MS = 2500;
const TYPING_DISPLAY_MS = 4000;

type TypingPayload = {
  userId: string;
};

/** Ephemeral typing indicator via Supabase Realtime broadcast (no DB writes). */
export function useTypingIndicator(
  conversationId: string | null,
  userId: string | undefined,
  enabled = true,
) {
  const [counterpartIsTyping, setCounterpartIsTyping] = useState(false);
  const lastSentRef = useRef(0);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | null>(
    null,
  );

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      setCounterpartIsTyping(false);
    }, TYPING_DISPLAY_MS);
  }, [clearHideTimeout]);

  useEffect(() => {
    if (!conversationId || !userId || !enabled) {
      setCounterpartIsTyping(false);
      return;
    }

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`typing:${conversationId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload.payload as TypingPayload | undefined;
        if (!data?.userId || data.userId === userId) return;
        setCounterpartIsTyping(true);
        scheduleHide();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      clearHideTimeout();
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [clearHideTimeout, conversationId, enabled, scheduleHide, userId]);

  const notifyTyping = useCallback(() => {
    if (!conversationId || !userId || !enabled) return;

    const now = Date.now();
    if (now - lastSentRef.current < TYPING_HEARTBEAT_MS) return;
    lastSentRef.current = now;

    void channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId } satisfies TypingPayload,
    });
  }, [conversationId, enabled, userId]);

  return { counterpartIsTyping, notifyTyping };
}
