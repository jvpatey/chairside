import { router } from 'expo-router';

import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { WorkerProfessionalView } from '@/components/worker/WorkerProfessionalView';
import { getSetupEditRoute } from '@/hooks/useSetupEditMode';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { navigateToWorkerProfileHub } from '@/lib/routing';

export default function WorkerProfileProfessionalScreen() {
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();

  if (!isWorkerProfileReady) return null;

  return (
    <ProfileDetailScreen
      title="Professional background"
      subtitle="Your roles, experience, location, and skills clinics use to understand your fit."
      actionLabel="Edit"
      onActionPress={() =>
        router.push(getSetupEditRoute('/(worker-setup)/basics', 'worker-professional'))
      }
      onBack={() => navigateToWorkerProfileHub(router)}>
      <WorkerProfessionalView profile={workerProfile} />
    </ProfileDetailScreen>
  );
}
