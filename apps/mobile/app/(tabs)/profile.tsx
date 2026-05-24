import { router } from 'expo-router';
import { View } from 'react-native';

import { AccountSessionActions } from '@/components/account/AccountSessionActions';
import { ProfileSection } from '@/components/worker/ProfileSection';
import { WorkerApplicationKitView } from '@/components/worker/WorkerApplicationKitView';
import { WorkerProfessionalView } from '@/components/worker/WorkerProfessionalView';
import { WorkerProfileHero } from '@/components/worker/WorkerProfileHero';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSignOut } from '@/hooks/useSignOut';
import { WORKER_SETUP_APPLICATION, WORKER_SETUP_BASICS } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function WorkerProfileScreen() {
  const { profile, user } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { isSigningOut, signOut } = useSignOut();
  const { isDeleting, confirmDeleteAccount } = useDeleteAccount();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    content: { gap: spacing.xl },
    accountSection: {
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      paddingTop: spacing.xl,
    },
  }));

  if (!isWorkerProfileReady) return null;

  return (
    <Screen title="Profile">
      <View style={styles.content}>
        <WorkerProfileHero
          displayName={profile?.display_name}
          email={user?.email}
          profile={workerProfile}
          editable
        />

        <ProfileSection
          title="Professional background"
          subtitle="Role, experience, location, and skills."
          actionLabel="Edit"
          onActionPress={() => router.push(WORKER_SETUP_BASICS)}>
          <WorkerProfessionalView profile={workerProfile} />
        </ProfileSection>

        <ProfileSection
          title="Application kit"
          subtitle="Photo, resume, and default note sent with applications."
          actionLabel="Edit"
          onActionPress={() => router.push(WORKER_SETUP_APPLICATION)}>
          <WorkerApplicationKitView profile={workerProfile} />
        </ProfileSection>

        <View style={styles.accountSection}>
          <ProfileSection
            title="Account settings"
            subtitle="Sign out or permanently delete your account.">
            <AccountSessionActions
              isSigningOut={isSigningOut}
              isDeleting={isDeleting}
              onSignOut={signOut}
              onDeleteAccount={confirmDeleteAccount}
              deleteDescription="Permanently remove your account, worker profile, applications, and uploaded resume. This action cannot be undone."
            />
          </ProfileSection>
        </View>
      </View>
    </Screen>
  );
}
