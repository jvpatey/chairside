import type { WorkerProfileUpdate } from '@chairside/api';
import {
  completeWorkerSetup,
  isWorkerProfileComplete,
  upsertWorkerProfile,
} from '@chairside/api';
import { useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';

export function useWorkerSetupSave() {
  const { user } = useAuth();
  const { refreshWorkerProfile } = useWorkerProfile();

  const save = useCallback(
    async (partial: WorkerProfileUpdate) => {
      if (!user?.id) throw new Error('Not signed in');
      let saved = await upsertWorkerProfile(user.id, partial);
      // Soft setup: stamp setup_completed_at once core fields exist (SMS eligibility).
      if (!saved.setup_completed_at && isWorkerProfileComplete(saved)) {
        saved = await completeWorkerSetup(user.id);
      }
      await refreshWorkerProfile();
      return saved;
    },
    [user?.id, refreshWorkerProfile],
  );

  return { save };
}
