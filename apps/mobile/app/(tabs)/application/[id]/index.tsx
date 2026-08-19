import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { MasterDetailLayout } from '@/components/ui/MasterDetailLayout';
import { WorkerApplicationDetailPane } from '@/components/worker/WorkerApplicationDetailPane';
import { WorkerFillInsInboxPanel } from '@/components/worker/WorkerFillInsInboxPanel';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useWorkerHiringCelebration } from '@/hooks/useWorkerHiringCelebration';
import type { FillInsTabMode } from '@/lib/fillInFilters';
import {
  getWorkerApplicationsRoute,
  navigateAfterWorkerApplication,
  type WorkerApplicationReturnTarget,
} from '@/lib/routing';
import { IS_WEB } from '@/lib/webPressableStyles';

function isFillInApplicationReturn(returnTo?: string) {
  return (
    returnTo === 'fill-ins-tab' ||
    returnTo === 'open-fill-ins' ||
    returnTo === 'past-fill-ins'
  );
}

function fillInsTabModeFromReturnTo(returnTo?: string): FillInsTabMode {
  if (returnTo === 'past-fill-ins') return 'history';
  if (returnTo === 'open-fill-ins') return 'open';
  return 'pending';
}

export default function WorkerApplicationDetailScreen() {
  const { isTablet } = useResponsiveLayout();
  const { id, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: string }>();
  const applicationId = typeof id === 'string' ? id : '';
  const resolvedReturnTo =
    typeof returnTo === 'string' ? (returnTo as WorkerApplicationReturnTarget) : undefined;
  const {
    celebrationVisible,
    celebrationPayload,
    showCelebration,
    closeCelebration,
  } = useHiringCelebration();
  useWorkerHiringCelebration(showCelebration);

  const goBack = useCallback(() => {
    navigateAfterWorkerApplication(router, resolvedReturnTo);
  }, [resolvedReturnTo]);

  const fromFillIns = isFillInApplicationReturn(resolvedReturnTo);
  const useWebApplicationsSplit = IS_WEB && isTablet && !fromFillIns;
  const useFillInSplit = isTablet && fromFillIns;

  // Web Applications hub owns the persistent split. Deep links into this route
  // redirect there unless we came from Fill-ins. iPad stays full-screen.
  if (useWebApplicationsSplit && applicationId) {
    return <Redirect href={getWorkerApplicationsRoute(applicationId)} />;
  }

  const detail = (
    <WorkerApplicationDetailPane
      applicationId={applicationId}
      returnTo={resolvedReturnTo}
      onClose={goBack}
      embedded={useFillInSplit}
    />
  );

  if (useFillInSplit) {
    return (
      <>
        <MasterDetailLayout
          roundedPanes
          showDetail
          master={
            <WorkerFillInsInboxPanel
              compact
              initialMode={fillInsTabModeFromReturnTo(resolvedReturnTo)}
            />
          }
          detail={detail}
        />
        <HiringCelebrationModal
          visible={celebrationVisible}
          payload={celebrationPayload}
          onClose={() => void closeCelebration()}
        />
      </>
    );
  }

  return (
    <>
      {detail}
      <HiringCelebrationModal
        visible={celebrationVisible}
        payload={celebrationPayload}
        onClose={() => void closeCelebration()}
      />
    </>
  );
}
