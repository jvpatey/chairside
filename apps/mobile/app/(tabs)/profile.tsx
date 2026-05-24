import { router } from 'expo-router';
import { View } from 'react-native';

import { AccountSessionActions } from '@/components/account/AccountSessionActions';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WorkerAccountSection } from '@/components/worker/WorkerAccountSection';
import { WorkerApplicationKitView } from '@/components/worker/WorkerApplicationKitView';
import { WorkerProfessionalView } from '@/components/worker/WorkerProfessionalView';
import { ProfileSection } from '@/components/worker/ProfileSection';
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
    actions: { gap: spacing.sm },
    accountSection: {
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      paddingTop: spacing.xl,
      gap: spacing.md,
    },
  }));

  if (!isWorkerProfileReady) return null;

  return (
    <Screen title="Profile" subtitle="Your account, professional background, and application kit.">
      <View style={styles.content}>
        <WorkerAccountSection displayName={profile?.display_name} email={user?.email} />

        <WorkerProfessionalView profile={workerProfile} />
        <View style={styles.actions}>
          <OnboardingButton
            label={workerProfile ? 'Edit background' : 'Add background'}
            variant="secondary"
            onPress={() => router.push(WORKER_SETUP_BASICS)}
          />
        </View>

        <WorkerApplicationKitView profile={workerProfile} />
        <View style={styles.actions}>
          <OnboardingButton
            label="Edit application kit"
            variant="secondary"
            onPress={() => router.push(WORKER_SETUP_APPLICATION)}
          />
        </View>

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
