import { useCallback, useEffect, useState } from 'react';

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

export function useClinicListingViewMode(surface: ClinicListingViewSurface) {
  const { user } = useAuth();
  const { organizationId, clinicId } = useClinicProfile();
  const { isWide } = useResponsiveLayout();
  const fallbackMode = defaultClinicListingViewMode(isWide);
  const [storedMode, setStoredMode] = useState<ClinicListingViewMode | null>(null);
  const scopeId = organizationId ?? clinicId ?? user?.id ?? null;

  useEffect(() => {
    if (!user?.id || !scopeId) {
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
  }, [scopeId, surface, user?.id]);

  const setMode = useCallback(
    (mode: ClinicListingViewMode) => {
      setStoredMode(mode);
      if (!user?.id || !scopeId) return;
      void saveStoredClinicListingViewMode(user.id, scopeId, surface, mode);
    },
    [scopeId, surface, user?.id],
  );

  return {
    mode: storedMode ?? fallbackMode,
    setMode,
    isWide,
  };
}
