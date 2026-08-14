import { useCallback } from 'react';

import type { CelebrationCandidate } from '@/lib/hiringCelebrationCandidates';
import type { HiringCelebrationPayload } from '@/lib/hiringCelebrationCopy';
import { pickWorkerHiringCelebration } from '@/lib/hiringCelebrationGate';
import {
  addKnownHiredApplicationIds,
  filterUncelebratedCelebrationCandidates,
  getKnownHiredApplicationIds,
  markApplicationCelebrated,
} from '@/lib/hiringCelebrationStorage';

export function useWorkerHiringCelebration(
  showCelebration: (payload: HiringCelebrationPayload) => void,
) {
  const checkApplications = useCallback(
    async (applications: CelebrationCandidate[]) => {
      const known = await getKnownHiredApplicationIds('worker');
      const { toShow, nextKnownHiredIds } = pickWorkerHiringCelebration(applications, known);
      if (toShow) nextKnownHiredIds.add(toShow.id);
      await addKnownHiredApplicationIds('worker', nextKnownHiredIds);

      if (!toShow) return;

      const uncelebrated = await filterUncelebratedCelebrationCandidates('worker', [toShow]);
      if (uncelebrated.length === 0) return;

      await markApplicationCelebrated(
        'worker',
        toShow.id,
        toShow.updatedAt ?? new Date().toISOString(),
      );

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
