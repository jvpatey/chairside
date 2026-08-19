import { router } from 'expo-router';

import { AuthenticatedLegalDocument } from '@/components/legal/AuthenticatedLegalDocument';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { PRIVACY_POLICY_CONTENT } from '@/content/legal/privacy';
import { WORKER_AUTH_LEGAL_PATHS, navigateToWorkerProfileHub } from '@/lib/routing';

export default function WorkerProfilePrivacyScreen() {
  return (
    <ProfileDetailScreen
      title={PRIVACY_POLICY_CONTENT.title}
      subtitle="How we collect, use, and protect your information."
      onBack={() => navigateToWorkerProfileHub(router)}>
      <AuthenticatedLegalDocument
        content={PRIVACY_POLICY_CONTENT}
        legalPaths={WORKER_AUTH_LEGAL_PATHS}
      />
    </ProfileDetailScreen>
  );
}
