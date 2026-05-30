import { useCallback, useState } from 'react';

import type { HiringCelebrationPayload } from '@/lib/hiringCelebrationCopy';
import { markApplicationCelebrated } from '@/lib/hiringCelebrationStorage';

export function useHiringCelebration() {
  const [payload, setPayload] = useState<HiringCelebrationPayload | null>(null);
  const [visible, setVisible] = useState(false);

  const showCelebration = useCallback((next: HiringCelebrationPayload) => {
    setPayload(next);
    setVisible(true);
  }, []);

  const closeCelebration = useCallback(async () => {
    if (payload?.applicationId && payload.audience) {
      await markApplicationCelebrated(payload.audience, payload.applicationId);
    }
    setVisible(false);
    setPayload(null);
  }, [payload?.applicationId, payload?.audience]);

  return {
    celebrationVisible: visible,
    celebrationPayload: payload,
    showCelebration,
    closeCelebration,
  };
}
