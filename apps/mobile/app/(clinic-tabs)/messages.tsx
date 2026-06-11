import { ClinicMessagesInboxPanel } from '@/components/messaging/ClinicMessagesInboxPanel';
import { MessageSplitView } from '@/components/messaging/MessageSplitView';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export default function ClinicMessagesScreen() {
  const { isTablet } = useResponsiveLayout();

  if (isTablet) {
    return <MessageSplitView role="clinic" />;
  }

  return <ClinicMessagesInboxPanel />;
}
