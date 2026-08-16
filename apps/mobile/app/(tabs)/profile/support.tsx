import { router } from 'expo-router';

import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { AuthenticatedSupportDocument } from '@/components/support/AuthenticatedSupportDocument';
import { SUPPORT_PAGE_CONTENT } from '@/content/legal/support';
import { WORKER_AUTH_LEGAL_PATHS, navigateToWorkerProfileHub } from '@/lib/routing';

export default function WorkerProfileSupportScreen() {
  return (
    <ProfileDetailScreen
      title={SUPPORT_PAGE_CONTENT.title}
      subtitle="Contact us or browse help topics."
      onBack={() => navigateToWorkerProfileHub(router)}>
      <AuthenticatedSupportDocument legalPaths={WORKER_AUTH_LEGAL_PATHS} />
    </ProfileDetailScreen>
  );
}
