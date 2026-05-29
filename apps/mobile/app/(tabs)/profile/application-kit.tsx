import { router } from 'expo-router';

import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { WorkerApplicationKitView } from '@/components/worker/WorkerApplicationKitView';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { WORKER_SETUP_APPLICATION } from '@/lib/routing';

export default function WorkerProfileApplicationKitScreen() {
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();

  if (!isWorkerProfileReady) return null;

  return (
    <ProfileDetailScreen
      title="Application kit"
      subtitle="Photo, resume, and default note sent with applications."
      actionLabel="Edit setup"
      onActionPress={() => router.push(WORKER_SETUP_APPLICATION)}
      onBack={() => router.back()}>
      <WorkerApplicationKitView profile={workerProfile} />
    </ProfileDetailScreen>
  );
}
