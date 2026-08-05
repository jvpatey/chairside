import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import {
  ClinicBillingScreenContent,
  type ClinicBillingScrollFocus,
} from '@/components/billing/ClinicBillingScreenContent';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { navigateToClinicProfileHub } from '@/lib/routing';

function parseBillingFocus(value: string | string[] | undefined): ClinicBillingScrollFocus {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'group' || raw === 'clinic') return raw;
  return 'default';
}

export default function ClinicProfileBillingScreen() {
  const params = useLocalSearchParams<{ focus?: string | string[] }>();
  const scrollFocus = useMemo(() => parseBillingFocus(params.focus), [params.focus]);

  return (
    <ProfileDetailScreen
      title="Plans & billing"
      subtitle="Manage your clinic subscription, active posting limits, and paid features."
      onBack={() => navigateToClinicProfileHub(router)}>
      <ClinicBillingScreenContent scrollFocus={scrollFocus} />
    </ProfileDetailScreen>
  );
}
