import { router } from 'expo-router';

import { AccountProfileView } from '@/components/account/AccountProfileView';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { CLINIC_HOME } from '@/lib/routing';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSignOut } from '@/hooks/useSignOut';

export default function ClinicAccountProfileScreen() {
  const { user } = useAuth();
  const { isSigningOut, signOut } = useSignOut();
  const { isDeleting, confirmDeleteAccount } = useDeleteAccount();

  return (
    <ProfileDetailScreen
      title="Profile"
      onBack={() => router.replace(CLINIC_HOME)}
      headerRight={<SignOutHeaderButton />}>
      <AccountProfileView
        user={user}
        email={user?.email}
        accountTypeLabel="Clinic"
        isSigningOut={isSigningOut}
        isDeleting={isDeleting}
        onSignOut={signOut}
        onDeleteAccount={confirmDeleteAccount}
        deleteDescription="Permanently remove your account, clinic profile, all postings, and associated applications. This action cannot be undone."
      />
    </ProfileDetailScreen>
  );
}
