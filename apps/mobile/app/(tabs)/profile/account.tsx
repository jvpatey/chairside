import { router } from 'expo-router';

import { AccountScreenContent } from '@/components/account/AccountScreenContent';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSignOut } from '@/hooks/useSignOut';
import { ACCOUNT_DELETION_DESCRIPTION } from '@/lib/accountDeletionCopy';
import { getAccountTypeLabel } from '@/lib/profileHubSubtitles';
import { navigateToWorkerProfileHub } from '@/lib/routing';

export default function WorkerProfileAccountScreen() {
  const { user, profile } = useAuth();
  const { isSigningOut, signOut } = useSignOut();
  const { isDeleting, confirmDeleteAccount } = useDeleteAccount();

  if (!user?.id) return null;

  return (
    <ProfileDetailScreen
      title="Account"
      subtitle="Password, privacy, sign out, and account deletion."
      onBack={() => navigateToWorkerProfileHub(router)}>
      <AccountScreenContent
        user={user}
        displayName={profile?.display_name}
        accountTypeLabel={getAccountTypeLabel('worker')}
        audience="worker"
        isSigningOut={isSigningOut}
        onSignOut={signOut}
        isDeleting={isDeleting}
        onDeleteAccount={confirmDeleteAccount}
        deleteDescription={ACCOUNT_DELETION_DESCRIPTION}
      />
    </ProfileDetailScreen>
  );
}
