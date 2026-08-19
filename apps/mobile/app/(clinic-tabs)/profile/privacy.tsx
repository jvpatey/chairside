import { router } from 'expo-router';

import { AuthenticatedLegalDocument } from '@/components/legal/AuthenticatedLegalDocument';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { PRIVACY_POLICY_CONTENT } from '@/content/legal/privacy';
import { CLINIC_AUTH_LEGAL_PATHS, navigateToClinicProfileHub } from '@/lib/routing';

export default function ClinicProfilePrivacyScreen() {
  return (
    <ProfileDetailScreen
      title={PRIVACY_POLICY_CONTENT.title}
      subtitle="How we collect, use, and protect your information."
      onBack={() => navigateToClinicProfileHub(router)}>
      <AuthenticatedLegalDocument
        content={PRIVACY_POLICY_CONTENT}
        legalPaths={CLINIC_AUTH_LEGAL_PATHS}
      />
    </ProfileDetailScreen>
  );
}
