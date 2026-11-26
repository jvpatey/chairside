import { Redirect } from 'expo-router';

import { CLINIC_FINISH_PROFILE } from '@/lib/routing';

/** Signup uses focused capture screens — not the clinic-setup wizard. */
export default function ClinicSetupIndex() {
  return <Redirect href={CLINIC_FINISH_PROFILE} />;
}
