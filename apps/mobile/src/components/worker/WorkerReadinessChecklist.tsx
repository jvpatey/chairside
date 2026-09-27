import type { WorkerProfile } from '@chairside/api';
import { isWorkerProfileComplete } from '@chairside/api';
import { router } from 'expo-router';
import { useMemo } from 'react';

import { GetStartedChecklistCard } from '@/components/dashboard/GetStartedChecklistCard';
import { useDismissedGetStartedChecklist } from '@/hooks/useDismissedGetStartedChecklist';
import { useGetStartedBrowseProgress } from '@/contexts/GetStartedBrowseProgressContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getFillInSmsStatus } from '@/lib/fillInAvailabilitySummary';
import {
  areAllGetStartedItemsComplete,
  isWorkerApplicationKitStarted,
  isWorkerFillInsStepComplete,
  isWorkerRolesStepComplete,
  type GetStartedChecklistItem,
} from '@/lib/getStartedChecklist';
import { type WorkerFillInEngagementProfile } from '@/lib/workerFillInGetStarted';
import {
  WORKER_BROWSE,
  WORKER_FILLIN_AVAILABILITY,
  WORKER_FILLINS,
  WORKER_SETUP_APPLICATION,
  WORKER_SETUP_BASICS,
} from '@/lib/routing';

type WorkerReadinessChecklistProps = {
  workerProfile: WorkerProfile | null;
  jobApplicationCount: number;
  shiftApplicationCount: number;
};

export function WorkerReadinessChecklist({
  workerProfile,
  jobApplicationCount,
  shiftApplicationCount,
}: WorkerReadinessChecklistProps) {
  const { isHydrated, isDismissed, dismiss } = useDismissedGetStartedChecklist('worker');
  const {
    visitedRoles,
    isHydrated: isBrowseHydrated,
    refresh: refreshBrowseProgress,
  } = useGetStartedBrowseProgress();

  useRefreshOnFocus(refreshBrowseProgress);

  const rolesComplete = isWorkerRolesStepComplete({ jobApplicationCount, visitedRoles });
  const fillInsComplete = isWorkerFillInsStepComplete({
    shiftApplicationCount,
    workerProfile: workerProfile as WorkerFillInEngagementProfile | undefined,
  });
  const textsOn = getFillInSmsStatus(workerProfile).smsActive;

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
        id: 'fill-in-alerts',
        title: fillInsComplete ? 'Fill-in alerts on' : 'Turn on fill-in alerts',
        body: fillInsComplete
          ? textsOn
            ? 'You get same-day fill-ins by push and text.'
            : 'You get same-day fill-in alerts. Add texts in Fill-ins for faster alerts.'
          : 'Hear about same-day shifts near you the moment clinics post them.',
        complete: fillInsComplete,
        primary: isWorkerProfileComplete(workerProfile) && !fillInsComplete,
        onPress: () => router.push(fillInsComplete ? WORKER_FILLINS : WORKER_FILLIN_AVAILABILITY),
      },
    ],
    [fillInsComplete, jobApplicationCount, rolesComplete, textsOn, workerProfile],
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
