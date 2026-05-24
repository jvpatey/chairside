import { Redirect } from 'expo-router';

import { WORKER_FILLINS } from '@/lib/routing';

export default function WorkerAvailabilityRedirect() {
  return <Redirect href={WORKER_FILLINS} />;
}
