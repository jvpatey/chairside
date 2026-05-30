import { getFillInPendingCount } from '@chairside/api';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

type FillInPendingContextValue = {
  pendingCount: number;
  refreshPending: () => Promise<void>;
};

const FillInPendingContext = createContext<FillInPendingContextValue | null>(null);

export function FillInPendingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPending = useCallback(async () => {
    if (!user?.id) {
      setPendingCount(0);
      return;
    }

    try {
      const count = await getFillInPendingCount(user.id);
      setPendingCount(count);
    } catch {
      setPendingCount(0);
    }
  }, [user?.id]);

  useRefreshOnFocus(refreshPending);

  const value = useMemo(
    () => ({
      pendingCount,
      refreshPending,
    }),
    [pendingCount, refreshPending],
  );

  return <FillInPendingContext.Provider value={value}>{children}</FillInPendingContext.Provider>;
}

export function useFillInPending() {
  const context = useContext(FillInPendingContext);
  return context ?? { pendingCount: 0, refreshPending: async () => {} };
}
