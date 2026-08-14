import { useCallback } from 'react';

import type { HiringCelebrationPayload } from '@/lib/hiringCelebrationCopy';
import { pickWorkerHiringCelebration } from '@/lib/hiringCelebrationGate';
import {
  filterUncelebratedCelebrationCandidates,
  getKnownHiredApplicationIds,
  setKnownHiredApplicationIds,
} from '@/lib/hiringCelebrationStorage';

type CelebrationCandidate = {
  id: string;
  postType: 'job' | 'shift';
  status: string;
  counterpartName: string;
  postTitle: string;
  shiftDateLabel?: string | null;
  updatedAt?: string;
};

export function useWorkerHiringCelebration(
  showCelebration: (payload: HiringCelebrationPayload) => void,
) {
  const checkApplications = useCallback(
    async (applications: CelebrationCandidate[]) => {
      const known = await getKnownHiredApplicationIds('worker');
      const { toShow, nextKnownHiredIds } = pickWorkerHiringCelebration(applications, known);
      await setKnownHiredApplicationIds('worker', nextKnownHiredIds);

      if (!toShow) return;

      const uncelebrated = await filterUncelebratedCelebrationCandidates('worker', [toShow]);
      if (uncelebrated.length === 0) {
        nextKnownHiredIds.add(toShow.id);
        await setKnownHiredApplicationIds('worker', nextKnownHiredIds);
        return;
      }

      showCelebration({
        applicationId: toShow.id,
        postType: toShow.postType,
        audience: 'worker',
        counterpartName: toShow.counterpartName,
        postTitle: toShow.postTitle,
        shiftDateLabel: toShow.shiftDateLabel,
        applicationUpdatedAt: toShow.updatedAt,
      });
    },
    [showCelebration],
  );

  return { checkApplications };
}
