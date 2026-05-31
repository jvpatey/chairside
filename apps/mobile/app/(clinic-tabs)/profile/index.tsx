import { router } from 'expo-router';
import { View } from 'react-native';

import { ClinicProfileHero } from '@/components/clinic/ClinicProfileHero';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { ProfileSettingsGroup } from '@/components/profile/ProfileSettingsGroup';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import {
  getAccountSubtitle,
  getClinicAboutSubtitle,
  getClinicMessagingSubtitle,
  getClinicNotificationsSubtitle,
  getClinicPracticeSubtitle,
} from '@/lib/profileHubSubtitles';
import {
  CLINIC_HOME,
  CLINIC_PROFILE_ABOUT,
  CLINIC_PROFILE_ACCOUNT,
  CLINIC_PROFILE_MESSAGING,
  CLINIC_PROFILE_NOTIFICATIONS,
  CLINIC_PROFILE_PRACTICE,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicAccountProfileScreen() {
  const { user } = useAuth();
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.xl },
  }));

  if (!isClinicProfileReady) return null;

  return (
    <ProfileDetailScreen
      title="Profile"
      onBack={() => router.replace(CLINIC_HOME)}
      headerRight={<SignOutHeaderButton />}>
      <View style={styles.content}>
        <ClinicProfileHero email={user?.email} profile={clinicProfile} editable />

        <ProfileSettingsGroup>
          <ProfileSettingsRow
            icon="business-outline"
            title="Practice details"
            subtitle={getClinicPracticeSubtitle(clinicProfile)}
            onPress={() => router.push(CLINIC_PROFILE_PRACTICE)}
          />
          <ProfileSettingsRow
            icon="document-text-outline"
            title="About"
            subtitle={getClinicAboutSubtitle(clinicProfile)}
            onPress={() => router.push(CLINIC_PROFILE_ABOUT)}
          />
          <ProfileSettingsRow
            icon="notifications-outline"
            title="Notifications"
            subtitle={getClinicNotificationsSubtitle()}
            onPress={() => router.push(CLINIC_PROFILE_NOTIFICATIONS)}
          />
          <ProfileSettingsRow
            icon="chatbubbles-outline"
            title="Messaging"
            subtitle={getClinicMessagingSubtitle(clinicProfile)}
            onPress={() => router.push(CLINIC_PROFILE_MESSAGING)}
          />
          <ProfileSettingsRow
            icon="person-circle-outline"
            title="Account"
            subtitle={getAccountSubtitle(user?.email)}
            onPress={() => router.push(CLINIC_PROFILE_ACCOUNT)}
          />
        </ProfileSettingsGroup>
      </View>
    </ProfileDetailScreen>
  );
}
