import { Redirect, router } from 'expo-router';

import { ClinicPracticeView } from '@/components/clinic/ClinicPracticeView';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { CLINIC_PROFILE_LOCATIONS, navigateToClinicProfileHub } from '@/lib/routing';

export default function ClinicProfilePracticeScreen() {
  const { clinicProfile, isClinicProfileReady, isGroup } = useClinicProfile();

  if (!isClinicProfileReady) return null;
  if (isGroup) {
    return <Redirect href={CLINIC_PROFILE_LOCATIONS} />;
  }

  return (
    <ProfileDetailScreen
      title="Practice details"
      subtitle="Clinic name, phone, and address."
      onBack={() => navigateToClinicProfileHub(router)}>
      <ClinicPracticeView profile={clinicProfile} />
    </ProfileDetailScreen>
  );
}
