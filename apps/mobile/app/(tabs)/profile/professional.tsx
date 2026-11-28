import { router } from 'expo-router';

import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { WorkerYouProfileView } from '@/components/worker/WorkerYouProfileView';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { navigateToWorkerProfileHub } from '@/lib/routing';

export default function WorkerProfileProfessionalScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();

  if (!user?.id) return null;

  return (
    <ProfileDetailScreen
      title="Profile"
      subtitle="Photo, contact, role, and city — edit everything here."
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
      />
    </ProfileDetailScreen>
  );
}
