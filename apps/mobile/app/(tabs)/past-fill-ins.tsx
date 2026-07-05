import { router } from 'expo-router';
import { useEffect } from 'react';

import { WORKER_PAST_FILLINS } from '@/lib/routing';

/** @deprecated Use Fill-ins → History tab. Kept for deep links and returnTo navigation. */
export default function PastFillInsScreen() {
  useEffect(() => {
    router.replace(WORKER_PAST_FILLINS);
  }, []);

  return null;
}
