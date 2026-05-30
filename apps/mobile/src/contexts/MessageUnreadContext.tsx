import { getUnreadConversationCount } from '@chairside/api';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

type MessageUnreadContextValue = {
  unreadCount: number;
  refreshUnread: () => Promise<void>;
};

const MessageUnreadContext = createContext<MessageUnreadContextValue | null>(null);

type MessageUnreadProviderProps = {
  role: 'worker' | 'clinic';
  children: ReactNode;
};

export function MessageUnreadProvider({ role, children }: MessageUnreadProviderProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await getUnreadConversationCount(user.id, role);
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [role, user?.id]);

  useRefreshOnFocus(refreshUnread);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnread,
    }),
    [refreshUnread, unreadCount],
  );

  return (
    <MessageUnreadContext.Provider value={value}>{children}</MessageUnreadContext.Provider>
  );
}

export function useMessageUnread() {
  const context = useContext(MessageUnreadContext);
  return context ?? { unreadCount: 0, refreshUnread: async () => {} };
}
