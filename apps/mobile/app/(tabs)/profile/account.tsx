import { router } from 'expo-router';

import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { WorkerYouProfileView } from '@/components/worker/WorkerYouProfileView';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSignOut } from '@/hooks/useSignOut';
import { ACCOUNT_DELETION_DESCRIPTION } from '@/lib/accountDeletionCopy';
import { navigateToWorkerProfileHub } from '@/lib/routing';

export default function WorkerProfileAccountScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { isSigningOut, signOut } = useSignOut();
  const { isDeleting, confirmDeleteAccount } = useDeleteAccount();

  if (!user?.id) return null;

  return (
    <ProfileDetailScreen
      title="Profile"
      subtitle="Name, role, and city for fill-in texts."
      onBack={() => navigateToWorkerProfileHub(router)}>
      <WorkerYouProfileView
        user={user}
        displayName={profile?.display_name}
        firstName={profile?.first_name}
        lastName={profile?.last_name}
        workerProfile={workerProfile}
        onProfileRefresh={async () => {
          await refreshProfile();
          await refreshWorkerProfile();
        }}
        isSigningOut={isSigningOut}
        onSignOut={signOut}
        isDeleting={isDeleting}
        onDeleteAccount={confirmDeleteAccount}
        deleteDescription={ACCOUNT_DELETION_DESCRIPTION}
      />
    </ProfileDetailScreen>
  );
}
