import { AccountProfileView } from '@/components/account/AccountProfileView';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSignOut } from '@/hooks/useSignOut';

export default function ClinicAccountProfileScreen() {
  const { user } = useAuth();
  const { clinicProfile } = useClinicProfile();
  const { isSigningOut, signOut } = useSignOut();
  const { isDeleting, confirmDeleteAccount } = useDeleteAccount();

  return (
    <Screen title="Profile" subtitle={user?.email ?? undefined}>
      <AccountProfileView
        clinicName={clinicProfile?.clinic_name ?? null}
        accountTypeLabel="Clinic"
        isSigningOut={isSigningOut}
        isDeleting={isDeleting}
        onSignOut={signOut}
        onDeleteAccount={confirmDeleteAccount}
      />
    </Screen>
  );
}
