import { router } from 'expo-router';

import { AccountScreenContent } from '@/components/account/AccountScreenContent';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSignOut } from '@/hooks/useSignOut';
import { ACCOUNT_DELETION_DESCRIPTION } from '@/lib/accountDeletionCopy';
import { getAccountTypeLabel } from '@/lib/profileHubSubtitles';

export default function ClinicProfileAccountScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { isSigningOut, signOut } = useSignOut();
  const { isDeleting, confirmDeleteAccount } = useDeleteAccount();

  if (!user?.id) return null;

  return (
    <ProfileDetailScreen
      title="Account"
      subtitle="Your clinic name, password, login, sign out, and account deletion."
      onBack={() => router.back()}>
      <AccountScreenContent
        user={user}
        displayName={profile?.display_name}
        accountTypeLabel={getAccountTypeLabel('clinic')}
        onProfileRefresh={refreshProfile}
        isSigningOut={isSigningOut}
        onSignOut={signOut}
        isDeleting={isDeleting}
        onDeleteAccount={confirmDeleteAccount}
        deleteDescription={ACCOUNT_DELETION_DESCRIPTION}
      />
    </ProfileDetailScreen>
  );
}
