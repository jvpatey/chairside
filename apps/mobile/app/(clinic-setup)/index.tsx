import { Redirect } from 'expo-router';

import { CLINIC_SETUP_BASICS } from '@/lib/routing';

export default function ClinicSetupIndex() {
  return <Redirect href={CLINIC_SETUP_BASICS} />;
}
