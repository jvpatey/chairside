import { router } from 'expo-router';

import { AuthenticatedLegalDocument } from '@/components/legal/AuthenticatedLegalDocument';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { TERMS_OF_SERVICE_CONTENT } from '@/content/legal/terms';
import { CLINIC_AUTH_LEGAL_PATHS, navigateToClinicProfileHub } from '@/lib/routing';

export default function ClinicProfileTermsScreen() {
  return (
    <ProfileDetailScreen
      title={TERMS_OF_SERVICE_CONTENT.title}
      subtitle="Rules for using Chairside."
      onBack={() => navigateToClinicProfileHub(router)}>
      <AuthenticatedLegalDocument
        content={TERMS_OF_SERVICE_CONTENT}
        legalPaths={CLINIC_AUTH_LEGAL_PATHS}
      />
    </ProfileDetailScreen>
  );
}
