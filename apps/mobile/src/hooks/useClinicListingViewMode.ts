import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  defaultClinicListingViewMode,
  loadStoredClinicListingViewMode,
  saveStoredClinicListingViewMode,
  type ClinicListingViewMode,
  type ClinicListingViewSurface,
} from '@/lib/clinicListingViewStorage';

/** CSS grid list/table (with applicant column) is web-only; native uses cards. */
export const clinicListingSupportsListView = Platform.OS === 'web';

export function useClinicListingViewMode(surface: ClinicListingViewSurface) {
  const { user } = useAuth();
  const { organizationId, clinicId } = useClinicProfile();
  const { isWide } = useResponsiveLayout();
  const supportsListView = clinicListingSupportsListView;
  const fallbackMode = defaultClinicListingViewMode(isWide && supportsListView);
  const [storedMode, setStoredMode] = useState<ClinicListingViewMode | null>(null);
  const scopeId = organizationId ?? clinicId ?? user?.id ?? null;

  useEffect(() => {
    if (!user?.id || !scopeId || !supportsListView) {
      setStoredMode(null);
      return;
    }

    let cancelled = false;
    void loadStoredClinicListingViewMode(user.id, scopeId, surface).then((value) => {
      if (!cancelled) setStoredMode(value);
    });

    return () => {
      cancelled = true;
    };
  }, [scopeId, supportsListView, surface, user?.id]);

  const setMode = useCallback(
    (mode: ClinicListingViewMode) => {
      if (!supportsListView) return;
      setStoredMode(mode);
      if (!user?.id || !scopeId) return;
      void saveStoredClinicListingViewMode(user.id, scopeId, surface, mode);
    },
    [scopeId, supportsListView, surface, user?.id],
  );

  return {
    mode: supportsListView ? (storedMode ?? fallbackMode) : ('cards' as const),
    setMode,
    isWide,
    supportsListView,
  };
}
