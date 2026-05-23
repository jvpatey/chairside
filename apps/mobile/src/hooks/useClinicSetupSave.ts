import type { ClinicProfileUpdate } from '@chairside/api';
import { upsertClinicProfile } from '@chairside/api';
import { useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';

export function useClinicSetupSave() {
  const { user } = useAuth();
  const { refreshClinicProfile } = useClinicProfile();

  const save = useCallback(
    async (partial: ClinicProfileUpdate) => {
      if (!user?.id) throw new Error('Not signed in');
      const saved = await upsertClinicProfile(user.id, partial);
      await refreshClinicProfile();
      return saved;
    },
    [user?.id, refreshClinicProfile],
  );

  return { save };
}
