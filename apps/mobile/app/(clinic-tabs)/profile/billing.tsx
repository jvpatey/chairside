import { router } from 'expo-router';

import { ClinicBillingScreenContent } from '@/components/billing/ClinicBillingScreenContent';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';

export default function ClinicProfileBillingScreen() {
  return (
    <ProfileDetailScreen
      title="Plans & billing"
      subtitle="Manage your clinic subscription, active posting limits, and paid features."
      onBack={() => router.back()}>
      <ClinicBillingScreenContent />
    </ProfileDetailScreen>
  );
}
