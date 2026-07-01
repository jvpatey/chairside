import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { SUPPORT_PAGE_CONTENT } from '@/content/legal/support';

export default function SupportScreen() {
  return <LegalPageLayout content={SUPPORT_PAGE_CONTENT} currentPath="support" />;
}
