import { router } from 'expo-router';

import { ClinicBillingScreenContent } from '@/components/billing/ClinicBillingScreenContent';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { navigateToClinicProfileHub } from '@/lib/routing';

export default function ClinicProfileBillingScreen() {
  return (
    <ProfileDetailScreen
      title="Fill-ins & billing"
      subtitle="Free fill-in posts, credits, and pricing."
      onBack={() => navigateToClinicProfileHub(router)}>
      <ClinicBillingScreenContent />
    </ProfileDetailScreen>
  );
}
