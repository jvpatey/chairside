import { router } from 'expo-router';

import { ClinicPracticeView } from '@/components/clinic/ClinicPracticeView';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { CLINIC_SETUP_BASICS } from '@/lib/routing';

export default function ClinicProfilePracticeScreen() {
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();

  if (!isClinicProfileReady) return null;

  return (
    <ProfileDetailScreen
      title="Practice details"
      subtitle="Location, contact, and practice info."
      actionLabel="Edit"
      onActionPress={() => router.push(CLINIC_SETUP_BASICS)}
      onBack={() => router.back()}>
      <ClinicPracticeView profile={clinicProfile} />
    </ProfileDetailScreen>
  );
}
