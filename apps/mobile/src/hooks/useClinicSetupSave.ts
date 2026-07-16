import type { ClinicProfileUpdate } from '@chairside/api';
import { upsertClinicProfile } from '@chairside/api';
import { useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';

export function useClinicSetupSave() {
  const { user } = useAuth();
  const { clinicId, isOwner, refreshClinicProfile } = useClinicProfile();

  const save = useCallback(
    async (partial: ClinicProfileUpdate) => {
      if (!user?.id) throw new Error('Not signed in');
      if (!isOwner) throw new Error('Only the clinic owner can edit organization details.');
      const targetId = clinicId ?? user.id;
      const saved = await upsertClinicProfile(targetId, {
        ...partial,
        organization_id: targetId,
      });
      await refreshClinicProfile();
      return saved;
    },
    [clinicId, isOwner, user?.id, refreshClinicProfile],
  );

  return { save };
}
