import { isClinicGroupsEnabled } from '@chairside/api';
import { Redirect } from 'expo-router';

import { CLINIC_SETUP_ACCOUNT_TYPE, CLINIC_SETUP_BASICS } from '@/lib/routing';

export default function ClinicSetupIndex() {
  if (isClinicGroupsEnabled()) {
    return <Redirect href={CLINIC_SETUP_ACCOUNT_TYPE} />;
  }
  return <Redirect href={CLINIC_SETUP_BASICS} />;
}
