import { router } from 'expo-router';

import { ClinicAboutView } from '@/components/clinic/ClinicAboutView';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { CLINIC_SETUP_ABOUT } from '@/lib/routing';

export default function ClinicProfileAboutScreen() {
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();

  if (!isClinicProfileReady) return null;

  return (
    <ProfileDetailScreen
      title="About"
      subtitle="Description and website shown to candidates."
      actionLabel="Edit"
      onActionPress={() => router.push(CLINIC_SETUP_ABOUT)}
      onBack={() => router.back()}>
      <ClinicAboutView profile={clinicProfile} />
    </ProfileDetailScreen>
  );
}
