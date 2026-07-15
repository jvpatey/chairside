import { getFillInPendingCount, isClinicNewFillInRequest, type Application } from '@chairside/api';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useClinicActingContext } from '@/hooks/useClinicActingContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useRefreshOnForeground } from '@/hooks/useRefreshOnForeground';

type FillInPendingContextValue = {
  pendingCount: number;
  refreshPending: () => Promise<void>;
  isCoverRequestHighlighted: (
    application: Pick<Application, 'post_type' | 'status' | 'clinic_hidden_at'>,
  ) => boolean;
  getCoverRequestHighlightLabel: (
    application: Pick<Application, 'post_type' | 'status' | 'clinic_hidden_at'>,
  ) => string | null;
};

const FillInPendingContext = createContext<FillInPendingContextValue | null>(null);

export function FillInPendingProvider({ children }: { children: ReactNode }) {
  const { clinicId, scopedLocationIds } = useClinicActingContext();
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPending = useCallback(async () => {
    if (!clinicId) {
      setPendingCount(0);
      return;
    }

    try {
      const count = await getFillInPendingCount(clinicId, {
        locationIds: scopedLocationIds,
      });
      setPendingCount(count);
    } catch {
      setPendingCount(0);
    }
  }, [clinicId, scopedLocationIds]);

  const isCoverRequestHighlighted = useCallback(
    (application: Pick<Application, 'post_type' | 'status' | 'clinic_hidden_at'>) =>
      isClinicNewFillInRequest(application),
    [],
  );

  const getCoverRequestHighlightLabel = useCallback(
    (application: Pick<Application, 'post_type' | 'status' | 'clinic_hidden_at'>) => {
      if (!isClinicNewFillInRequest(application)) return null;
      return 'New cover request';
    },
    [],
  );

  useRefreshOnFocus(refreshPending);
  useRefreshOnForeground(refreshPending);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  const value = useMemo(
    () => ({
      pendingCount,
      refreshPending,
      isCoverRequestHighlighted,
      getCoverRequestHighlightLabel,
    }),
    [getCoverRequestHighlightLabel, isCoverRequestHighlighted, pendingCount, refreshPending],
  );

  return <FillInPendingContext.Provider value={value}>{children}</FillInPendingContext.Provider>;
}

export function useFillInPending() {
  const context = useContext(FillInPendingContext);
  return (
    context ?? {
      pendingCount: 0,
      refreshPending: async () => {},
      isCoverRequestHighlighted: () => false,
      getCoverRequestHighlightLabel: () => null,
    }
  );
}
