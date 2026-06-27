import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { MessageSplitView } from '@/components/messaging/MessageSplitView';
import { WorkerMessageClinicsPanel } from '@/components/messaging/WorkerMessageClinicsPanel';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { navigateAfterWorkerMessageClinics } from '@/lib/routing';

export function WorkerMessageClinicsScreen() {
  const { isTablet } = useResponsiveLayout();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const resolvedReturnTo = typeof returnTo === 'string' ? returnTo : undefined;

  const goBack = useCallback(() => {
    navigateAfterWorkerMessageClinics(router, resolvedReturnTo);
  }, [resolvedReturnTo]);

  if (isTablet) {
    return <MessageSplitView role="worker" masterView="clinics" />;
  }

  return <WorkerMessageClinicsPanel onBack={goBack} />;
}
