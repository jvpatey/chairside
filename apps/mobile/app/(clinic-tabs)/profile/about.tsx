import { router } from 'expo-router';

import { ClinicAboutView } from '@/components/clinic/ClinicAboutView';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { getSetupEditRoute } from '@/hooks/useSetupEditMode';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { navigateToClinicProfileHub } from '@/lib/routing';

export default function ClinicProfileAboutScreen() {
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();

  if (!isClinicProfileReady) return null;

  return (
    <ProfileDetailScreen
      title="About"
      subtitle="Description and website shown to candidates."
      actionLabel="Edit"
      onActionPress={() => router.push(getSetupEditRoute('/(clinic-setup)/about', 'clinic-about'))}
      onBack={() => navigateToClinicProfileHub(router)}>
      <ClinicAboutView profile={clinicProfile} />
    </ProfileDetailScreen>
  );
}
