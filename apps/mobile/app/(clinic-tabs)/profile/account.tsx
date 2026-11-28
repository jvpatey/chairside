import { router } from 'expo-router';

import { AccountScreenContent } from '@/components/account/AccountScreenContent';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSignOut } from '@/hooks/useSignOut';
import { ACCOUNT_DELETION_DESCRIPTION } from '@/lib/accountDeletionCopy';
import { getAccountTypeLabel } from '@/lib/profileHubSubtitles';
import { navigateToClinicProfileHub } from '@/lib/routing';

export default function ClinicProfileAccountScreen() {
  const { user, profile } = useAuth();
  const { isGroup } = useClinicProfile();
  const { isSigningOut, signOut } = useSignOut();
  const { isDeleting, confirmDeleteAccount } = useDeleteAccount();

  if (!user?.id) return null;

  return (
    <ProfileDetailScreen
      title="Account"
      subtitle="Manage your clinic login, privacy, and account access."
      onBack={() => navigateToClinicProfileHub(router)}>
      <AccountScreenContent
        user={user}
        displayName={profile?.display_name}
        accountTypeLabel={getAccountTypeLabel('clinic', { isGroup })}
        audience="clinic"
        isSigningOut={isSigningOut}
        onSignOut={signOut}
        isDeleting={isDeleting}
        onDeleteAccount={confirmDeleteAccount}
        deleteDescription={ACCOUNT_DELETION_DESCRIPTION}
      />
    </ProfileDetailScreen>
  );
}
