import { Redirect } from 'expo-router';

import { CLINIC_FINISH_PROFILE } from '@/lib/routing';

/** Account-type fork retired — send to focused clinic capture. */
export default function ClinicAccountTypeScreen() {
  return <Redirect href={CLINIC_FINISH_PROFILE} />;
}
