import { router } from 'expo-router';
import { View } from 'react-native';

import { ClinicAboutView } from '@/components/clinic/ClinicAboutView';
import { ClinicPracticeView } from '@/components/clinic/ClinicPracticeView';
import { ClinicProfileHero } from '@/components/clinic/ClinicProfileHero';
import { ProfileSection } from '@/components/worker/ProfileSection';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { CLINIC_SETUP_ABOUT, CLINIC_SETUP_BASICS } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicProfileScreen() {
  const { user } = useAuth();
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.xl },
  }));

  if (!isClinicProfileReady) return null;

  return (
    <Screen title="Clinic">
      <View style={styles.content}>
        <ClinicProfileHero email={user?.email} profile={clinicProfile} editable />

        <ProfileSection
          title="Practice details"
          subtitle="Location, contact, and practice info."
          actionLabel="Edit"
          onActionPress={() => router.push(CLINIC_SETUP_BASICS)}>
          <ClinicPracticeView profile={clinicProfile} />
        </ProfileSection>

        <ProfileSection
          title="About"
          subtitle="Description and website shown to candidates."
          actionLabel="Edit"
          onActionPress={() => router.push(CLINIC_SETUP_ABOUT)}>
          <ClinicAboutView profile={clinicProfile} />
        </ProfileSection>
      </View>
    </Screen>
  );
}
