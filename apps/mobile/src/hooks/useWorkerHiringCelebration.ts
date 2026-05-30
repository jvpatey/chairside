import { useCallback } from 'react';

import type { HiringCelebrationPayload } from '@/lib/hiringCelebrationCopy';
import { filterUncelebratedApplicationIds } from '@/lib/hiringCelebrationStorage';

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
      const eligible = applications.filter((application) =>
        application.postType === 'shift'
          ? application.status === 'hired'
          : application.status === 'selected',
      );

      if (eligible.length === 0) return;

      const sorted = [...eligible].sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      });

      const uncelebrated = await filterUncelebratedApplicationIds(sorted.map((item) => item.id));
      if (uncelebrated.length === 0) return;

      const next = sorted.find((item) => uncelebrated.includes(item.id));
      if (!next) return;

      showCelebration({
        applicationId: next.id,
        postType: next.postType,
        audience: 'worker',
        counterpartName: next.counterpartName,
        postTitle: next.postTitle,
        shiftDateLabel: next.shiftDateLabel,
      });
    },
    [showCelebration],
  );

  return { checkApplications };
}
