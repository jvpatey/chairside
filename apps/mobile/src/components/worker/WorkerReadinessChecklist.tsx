import type { WorkerProfile } from '@chairside/api';
import { isWorkerProfileComplete } from '@chairside/api';
import { router } from 'expo-router';
import { useMemo } from 'react';

import { GetStartedChecklistCard } from '@/components/dashboard/GetStartedChecklistCard';
import { useDismissedGetStartedChecklist } from '@/hooks/useDismissedGetStartedChecklist';
import { useGetStartedBrowseProgress } from '@/contexts/GetStartedBrowseProgressContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import {
  areAllGetStartedItemsComplete,
  isWorkerApplicationKitStarted,
  isWorkerFillInsStepComplete,
  isWorkerRolesStepComplete,
  type GetStartedChecklistItem,
} from '@/lib/getStartedChecklist';
import {
  WORKER_BROWSE,
  WORKER_FILLINS,
  WORKER_SETUP_APPLICATION,
  WORKER_SETUP_BASICS,
} from '@/lib/routing';

type WorkerReadinessChecklistProps = {
  workerProfile: WorkerProfile | null;
  jobApplicationCount: number;
  shiftApplicationCount: number;
  savedShiftCount?: number;
};

export function WorkerReadinessChecklist({
  workerProfile,
  jobApplicationCount,
  shiftApplicationCount,
  savedShiftCount = 0,
}: WorkerReadinessChecklistProps) {
  const { isHydrated, isDismissed, dismiss } = useDismissedGetStartedChecklist('worker');
  const { availabilityBlocks } = useWorkerProfile();
  const {
    visitedRoles,
    visitedFillIns,
    isHydrated: isBrowseHydrated,
    refresh: refreshBrowseProgress,
  } = useGetStartedBrowseProgress();

  useRefreshOnFocus(refreshBrowseProgress);

  const rolesComplete = isWorkerRolesStepComplete({ jobApplicationCount, visitedRoles });
  const fillInsComplete = isWorkerFillInsStepComplete({
    shiftApplicationCount,
    visitedFillIns,
    workerProfile,
    availabilityBlockCount: availabilityBlocks.length,
    savedShiftCount,
  });
  const fillInsConfigured =
    Boolean(workerProfile?.short_notice_available) ||
    availabilityBlocks.length > 0 ||
    (workerProfile?.fill_in_notification_mode ?? 'off') !== 'off' ||
    savedShiftCount > 0;

  const items = useMemo<GetStartedChecklistItem[]>(
    () => [
      {
        id: 'profile',
        title: isWorkerProfileComplete(workerProfile)
          ? 'Profile complete'
          : 'Complete your profile to apply',
        body: isWorkerProfileComplete(workerProfile)
          ? 'Your role, experience, and location are set.'
          : 'Clinics need your role, experience, and location before you can apply or receive fill-ins.',
        complete: isWorkerProfileComplete(workerProfile),
        primary: !isWorkerProfileComplete(workerProfile),
        onPress: () => router.push(WORKER_SETUP_BASICS),
      },
      {
        id: 'application-kit',
        title: isWorkerApplicationKitStarted(workerProfile)
          ? 'Application profile added'
          : 'Add your application profile',
        body: isWorkerApplicationKitStarted(workerProfile)
          ? 'Photo, resume, or note ready for clinics.'
          : 'Add a photo, resume, and default note for polished applications.',
        complete: isWorkerApplicationKitStarted(workerProfile),
        onPress: () => router.push(WORKER_SETUP_APPLICATION),
      },
      {
        id: 'browse-roles',
        title: rolesComplete ? 'Explored open roles' : 'Browse open roles',
        body: rolesComplete
          ? jobApplicationCount > 0
            ? 'You have submitted at least one role application.'
            : 'You have browsed open roles near you.'
          : 'Find full-time and part-time positions near you.',
        complete: rolesComplete,
        onPress: () => router.push(WORKER_BROWSE),
      },
      {
        id: 'browse-fill-ins',
        title: fillInsComplete ? 'Explored fill-in shifts' : 'Browse fill-in shifts',
        body: fillInsComplete
          ? shiftApplicationCount > 0
            ? 'You have submitted at least one fill-in application.'
            : fillInsConfigured
              ? 'Your fill-in availability and alerts are set up.'
              : 'You have browsed temporary shifts near you.'
          : 'Temporary shifts are a fast way to get chairside experience.',
        complete: fillInsComplete,
        onPress: () => router.push(WORKER_FILLINS),
      },
    ],
    [
      fillInsComplete,
      fillInsConfigured,
      jobApplicationCount,
      rolesComplete,
      shiftApplicationCount,
      workerProfile,
    ],
  );

  if (
    !isHydrated ||
    !isBrowseHydrated ||
    isDismissed ||
    areAllGetStartedItemsComplete(items)
  ) {
    return null;
  }

  return (
    <GetStartedChecklistCard
      subtitle="Finish these steps to get the most out of Chairside."
      items={items}
      onDismiss={() => void dismiss()}
    />
  );
}
