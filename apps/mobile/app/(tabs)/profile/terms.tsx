import { router } from 'expo-router';

import { AuthenticatedLegalDocument } from '@/components/legal/AuthenticatedLegalDocument';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { TERMS_OF_SERVICE_CONTENT } from '@/content/legal/terms';
import { WORKER_AUTH_LEGAL_PATHS, navigateToWorkerProfileHub } from '@/lib/routing';

export default function WorkerProfileTermsScreen() {
  return (
    <ProfileDetailScreen
      title={TERMS_OF_SERVICE_CONTENT.title}
      subtitle="Rules for using Chairside."
      onBack={() => navigateToWorkerProfileHub(router)}>
      <AuthenticatedLegalDocument
        content={TERMS_OF_SERVICE_CONTENT}
        legalPaths={WORKER_AUTH_LEGAL_PATHS}
      />
    </ProfileDetailScreen>
  );
}
