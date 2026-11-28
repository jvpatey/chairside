import { router } from 'expo-router';
import { useEffect } from 'react';

import { WORKER_OPEN_FILLINS } from '@/lib/routing';

/** @deprecated Use Fill-ins Nearby tab. Kept for deep links and returnTo navigation. */
export default function OpenFillInsScreen() {
  useEffect(() => {
    router.replace(WORKER_OPEN_FILLINS);
  }, []);

  return null;
}
