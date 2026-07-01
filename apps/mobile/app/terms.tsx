import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { TERMS_OF_SERVICE_CONTENT } from '@/content/legal/terms';

export default function TermsOfServiceScreen() {
  return <LegalPageLayout content={TERMS_OF_SERVICE_CONTENT} currentPath="terms" />;
}
