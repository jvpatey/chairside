import type { AvailabilityBlockInput } from '@chairside/api';
import { upsertAvailabilityBlocks } from '@chairside/api';
import { useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';

export function useWorkerAvailabilitySave() {
  const { user } = useAuth();
  const { refreshAvailabilityBlocks } = useWorkerProfile();

  const saveBlocks = useCallback(
    async (blocks: AvailabilityBlockInput[]) => {
      if (!user?.id) throw new Error('Not signed in');
      const saved = await upsertAvailabilityBlocks(user.id, blocks);
      await refreshAvailabilityBlocks();
      return saved;
    },
    [user?.id, refreshAvailabilityBlocks],
  );

  return { saveBlocks };
}
