import { Redirect, router } from 'expo-router';

import { ClinicAboutView } from '@/components/clinic/ClinicAboutView';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { getSetupEditRoute } from '@/hooks/useSetupEditMode';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { CLINIC_PROFILE_GROUP, navigateToClinicProfileHub } from '@/lib/routing';

export default function ClinicProfileAboutScreen() {
  const { clinicProfile, isClinicProfileReady, isGroup, isOwner, locations } = useClinicProfile();

  if (!isClinicProfileReady) return null;
  if (isGroup) {
    // Group about content lives on Group profile.
    return <Redirect href={CLINIC_PROFILE_GROUP} />;
  }
  if (!isOwner) {
    return <Redirect href="/(clinic-tabs)/profile" />;
  }

  return (
    <ProfileDetailScreen
      title="About"
      subtitle="Your practice story and website — what candidates see on your public profile."
      actionLabel="Edit"
      onActionPress={() => router.push(getSetupEditRoute('/(clinic-setup)/about', 'clinic-about'))}
      onBack={() => navigateToClinicProfileHub(router)}>
      <ClinicAboutView profile={clinicProfile} isGroup={false} locations={locations} />
    </ProfileDetailScreen>
  );
}
