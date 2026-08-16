import { useLocalSearchParams } from 'expo-router';

import { WorkerApplicationsInboxPanel } from '@/components/worker/WorkerApplicationsInboxPanel';
import { WorkerApplicationSplitView } from '@/components/worker/WorkerApplicationSplitView';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

export default function WorkerApplicationsScreen() {
  const { isTablet } = useResponsiveLayout();
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>();
  const initialApplicationId =
    typeof applicationId === 'string' ? applicationId : undefined;

  if (isTablet) {
    return <WorkerApplicationSplitView initialApplicationId={initialApplicationId} />;
  }

  return <WorkerApplicationsInboxPanel />;
}
