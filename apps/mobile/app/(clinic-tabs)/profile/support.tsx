import { router } from 'expo-router';

import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { AuthenticatedSupportDocument } from '@/components/support/AuthenticatedSupportDocument';
import { SUPPORT_PAGE_CONTENT } from '@/content/legal/support';
import { CLINIC_AUTH_LEGAL_PATHS, navigateToClinicProfileHub } from '@/lib/routing';

export default function ClinicProfileSupportScreen() {
  return (
    <ProfileDetailScreen
      title={SUPPORT_PAGE_CONTENT.title}
      subtitle="Contact us or browse help topics."
      onBack={() => navigateToClinicProfileHub(router)}>
      <AuthenticatedSupportDocument legalPaths={CLINIC_AUTH_LEGAL_PATHS} />
    </ProfileDetailScreen>
  );
}
