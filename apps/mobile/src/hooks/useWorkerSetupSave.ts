import type { WorkerProfileUpdate } from '@chairside/api';
import { upsertWorkerProfile } from '@chairside/api';
import { useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';

export function useWorkerSetupSave() {
  const { user } = useAuth();
  const { refreshWorkerProfile } = useWorkerProfile();

  const save = useCallback(
    async (partial: WorkerProfileUpdate) => {
      if (!user?.id) throw new Error('Not signed in');
      const saved = await upsertWorkerProfile(user.id, partial);
      await refreshWorkerProfile();
      return saved;
    },
    [user?.id, refreshWorkerProfile],
  );

  return { save };
}
