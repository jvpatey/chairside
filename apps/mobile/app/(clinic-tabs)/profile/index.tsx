import { router } from 'expo-router';
import { View } from 'react-native';

import { AccountProfileView } from '@/components/account/AccountProfileView';
import { ClinicAboutView } from '@/components/clinic/ClinicAboutView';
import { ClinicPracticeView } from '@/components/clinic/ClinicPracticeView';
import { ClinicProfileHero } from '@/components/clinic/ClinicProfileHero';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { ProfileSettingsGroup } from '@/components/profile/ProfileSettingsGroup';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { ProfileSection } from '@/components/worker/ProfileSection';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSignOut } from '@/hooks/useSignOut';
import {
  CLINIC_HOME,
  CLINIC_PROFILE_MESSAGING,
  CLINIC_SETUP_ABOUT,
  CLINIC_SETUP_BASICS,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

function getClinicMessagingSubtitle(acceptsGeneralMessages: boolean): string {
  return acceptsGeneralMessages
    ? 'Candidates in your province can reach out without applying.'
    : 'General candidate messages are off.';
}

export default function ClinicAccountProfileScreen() {
  const { user } = useAuth();
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();
  const { isSigningOut, signOut } = useSignOut();
  const { isDeleting, confirmDeleteAccount } = useDeleteAccount();

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

        <ProfileSettingsGroup>
          <ProfileSettingsRow
            icon="chatbubbles-outline"
            title="Messaging"
            subtitle={getClinicMessagingSubtitle(
              clinicProfile?.accepts_general_candidate_messages ?? false,
            )}
            onPress={() => router.push(CLINIC_PROFILE_MESSAGING)}
          />
        </ProfileSettingsGroup>

        <AccountProfileView
          user={user}
          email={user?.email}
          accountTypeLabel="Clinic"
          isSigningOut={isSigningOut}
          isDeleting={isDeleting}
          onSignOut={signOut}
          onDeleteAccount={confirmDeleteAccount}
          deleteDescription="Permanently remove your account and login. Historical applications and messages will remain visible to others as no longer on Chairside."
        />
      </View>
    </ProfileDetailScreen>
  );
}
