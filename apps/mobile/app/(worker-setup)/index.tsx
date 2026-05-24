import { Redirect } from 'expo-router';

import { WORKER_SETUP_BASICS } from '@/lib/routing';

export default function WorkerSetupIndex() {
  return <Redirect href={WORKER_SETUP_BASICS} />;
}
