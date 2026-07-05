import { router } from 'expo-router';

import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { WorkerApplicationKitView } from '@/components/worker/WorkerApplicationKitView';
import { getSetupEditRoute } from '@/hooks/useSetupEditMode';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { navigateToWorkerProfileHub } from '@/lib/routing';

export default function WorkerProfileApplicationKitScreen() {
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();

  if (!isWorkerProfileReady) return null;

  return (
    <ProfileDetailScreen
      title="Application profile"
      subtitle="Your resume, photo, and note — what clinics see when you apply."
      actionLabel="Edit"
      onActionPress={() =>
        router.push(
          getSetupEditRoute('/(worker-setup)/application-kit', 'worker-application-kit'),
        )
      }
      onBack={() => navigateToWorkerProfileHub(router)}>
      <WorkerApplicationKitView profile={workerProfile} />
    </ProfileDetailScreen>
  );
}
