import { router } from 'expo-router';

import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { WorkerProfessionalView } from '@/components/worker/WorkerProfessionalView';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { WORKER_SETUP_BASICS } from '@/lib/routing';

export default function WorkerProfileProfessionalScreen() {
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();

  if (!isWorkerProfileReady) return null;

  return (
    <ProfileDetailScreen
      title="Professional background"
      subtitle="Role, experience, location, and skills."
      actionLabel="Edit"
      onActionPress={() => router.push(WORKER_SETUP_BASICS)}
      onBack={() => router.back()}>
      <WorkerProfessionalView profile={workerProfile} />
    </ProfileDetailScreen>
  );
}
