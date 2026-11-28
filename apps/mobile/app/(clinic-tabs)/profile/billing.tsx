import { Redirect } from 'expo-router';

import { CLINIC_PROFILE } from '@/lib/routing';

export default function ClinicProfileBillingScreen() {
  return <Redirect href={CLINIC_PROFILE} />;
}
