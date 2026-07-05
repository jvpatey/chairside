import { router } from 'expo-router';

import { ClinicPracticeView } from '@/components/clinic/ClinicPracticeView';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { getSetupEditRoute } from '@/hooks/useSetupEditMode';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { navigateToClinicProfileHub } from '@/lib/routing';

export default function ClinicProfilePracticeScreen() {
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();

  if (!isClinicProfileReady) return null;

  return (
    <ProfileDetailScreen
      title="Practice details"
      subtitle="Contact, location, and practice setup candidates use to understand your clinic."
      actionLabel="Edit"
      onActionPress={() =>
        router.push(getSetupEditRoute('/(clinic-setup)/basics', 'clinic-practice'))
      }
      onBack={() => navigateToClinicProfileHub(router)}>
      <ClinicPracticeView profile={clinicProfile} />
    </ProfileDetailScreen>
  );
}
