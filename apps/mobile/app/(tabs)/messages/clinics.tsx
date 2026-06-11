import { router } from 'expo-router';

import { MessageSplitView } from '@/components/messaging/MessageSplitView';
import { WorkerMessageClinicsPanel } from '@/components/messaging/WorkerMessageClinicsPanel';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export default function WorkerMessageClinicsScreen() {
  const { isTablet } = useResponsiveLayout();

  if (isTablet) {
    return <MessageSplitView role="worker" masterView="clinics" />;
  }

  return <WorkerMessageClinicsPanel onBack={() => router.back()} />;
}
