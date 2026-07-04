import { router } from 'expo-router';

import { ClinicMessagingPreferences } from '@/components/clinic/ClinicMessagingPreferences';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { navigateToClinicProfileHub } from '@/lib/routing';

export default function ClinicProfileMessagingScreen() {
  return (
    <ProfileDetailScreen
      title="Messaging"
      subtitle="Control how candidates can reach your clinic."
      onBack={() => navigateToClinicProfileHub(router)}>
      <ProfileSettingsCard title="Candidate outreach" icon="chatbubbles-outline">
        <ClinicMessagingPreferences />
      </ProfileSettingsCard>
    </ProfileDetailScreen>
  );
}
