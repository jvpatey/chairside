import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { PRIVACY_POLICY_CONTENT } from '@/content/legal/privacy';

export default function PrivacyPolicyScreen() {
  return <LegalPageLayout content={PRIVACY_POLICY_CONTENT} currentPath="privacy" />;
}
