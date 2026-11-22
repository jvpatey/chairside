import { Redirect } from 'expo-router';

import { WORKER_PROFILE_ACCOUNT } from '@/lib/routing';

/** About you merged into You / Account. */
export default function WorkerProfileProfessionalScreen() {
  return <Redirect href={WORKER_PROFILE_ACCOUNT} />;
}
