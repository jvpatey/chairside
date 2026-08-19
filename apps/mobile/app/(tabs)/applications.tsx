import { useLocalSearchParams } from 'expo-router';

import { WorkerApplicationsInboxPanel } from '@/components/worker/WorkerApplicationsInboxPanel';
import { WorkerApplicationSplitView } from '@/components/worker/WorkerApplicationSplitView';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { IS_WEB } from '@/lib/webPressableStyles';

export default function WorkerApplicationsScreen() {
  const { isTablet } = useResponsiveLayout();
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>();
  const initialApplicationId =
    typeof applicationId === 'string' ? applicationId : undefined;

  // List+detail split is web-only — iPad with the sidebar is too cramped.
  if (IS_WEB && isTablet) {
    return <WorkerApplicationSplitView initialApplicationId={initialApplicationId} />;
  }

  return <WorkerApplicationsInboxPanel />;
}
