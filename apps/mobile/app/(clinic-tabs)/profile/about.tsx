import { Redirect, router } from 'expo-router';

import { ClinicAboutView } from '@/components/clinic/ClinicAboutView';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { getSetupEditRoute } from '@/hooks/useSetupEditMode';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { navigateToClinicProfileHub } from '@/lib/routing';

export default function ClinicProfileAboutScreen() {
  const { clinicProfile, isClinicProfileReady, isGroup, isOwner } = useClinicProfile();

  if (!isClinicProfileReady) return null;
  if (isGroup && !isOwner) {
    return <Redirect href="/(clinic-tabs)/profile" />;
  }

  return (
    <ProfileDetailScreen
      title="About"
      subtitle="Your practice story and website — what candidates see on your public profile."
      actionLabel="Edit"
      onActionPress={() => router.push(getSetupEditRoute('/(clinic-setup)/about', 'clinic-about'))}
      onBack={() => navigateToClinicProfileHub(router)}>
      <ClinicAboutView profile={clinicProfile} />
    </ProfileDetailScreen>
  );
}
