import { AccountProfileView } from '@/components/account/AccountProfileView';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSignOut } from '@/hooks/useSignOut';

export default function ClinicAccountProfileScreen() {
  const { user } = useAuth();
  const { isSigningOut, signOut } = useSignOut();
  const { isDeleting, confirmDeleteAccount } = useDeleteAccount();

  return (
    <Screen title="Profile">
      <AccountProfileView
        email={user?.email}
        accountTypeLabel="Clinic"
        isSigningOut={isSigningOut}
        isDeleting={isDeleting}
        onSignOut={signOut}
        onDeleteAccount={confirmDeleteAccount}
        deleteDescription="Permanently remove your account, clinic profile, all postings, and associated applications. This action cannot be undone."
      />
    </Screen>
  );
}
