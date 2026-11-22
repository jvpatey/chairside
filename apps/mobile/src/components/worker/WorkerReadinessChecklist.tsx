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
  isWorkerFillInsStepComplete,
  isWorkerRolesStepComplete,
  type GetStartedChecklistItem,
} from '@/lib/getStartedChecklist';
import { type WorkerFillInEngagementProfile } from '@/lib/workerFillInGetStarted';
import {
  getWorkerFillInAvailabilityRoute,
  WORKER_BROWSE,
  WORKER_FILLINS,
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
  const profileComplete = isWorkerProfileComplete(workerProfile);

  const items = useMemo<GetStartedChecklistItem[]>(
    () => [
      {
        id: 'profile',
        title: profileComplete ? 'Profile ready' : 'Add role, phone, and city',
        body: profileComplete
          ? 'Enough to match you to nearby fill-ins.'
          : 'That’s all we need to text you about fill-ins.',
        complete: profileComplete,
        primary: !profileComplete,
        onPress: () => router.push(WORKER_SETUP_BASICS),
      },
      {
        id: 'fill-in-alerts',
        title: fillInsComplete ? 'Text alerts on' : 'Turn on text alerts',
        body: fillInsComplete
          ? textsOn
            ? 'You’ll get same-day fill-ins by text.'
            : 'Fill-ins are on — turn on texts for faster alerts.'
          : 'Hear about same-day shifts near you the moment clinics post them.',
        complete: fillInsComplete,
        primary: profileComplete && !fillInsComplete,
        onPress: () =>
          router.push(
            fillInsComplete
              ? WORKER_FILLINS
              : getWorkerFillInAvailabilityRoute('profile'),
          ),
      },
      {
        id: 'browse-roles',
        title: rolesComplete ? 'Explored open roles' : 'Browse open roles',
        body: rolesComplete
          ? jobApplicationCount > 0
            ? 'You’ve started a role conversation.'
            : 'You’ve browsed roles near you.'
          : 'Optional — see permanent openings when you want.',
        complete: rolesComplete,
        onPress: () => router.push(WORKER_BROWSE),
      },
    ],
    [fillInsComplete, jobApplicationCount, profileComplete, rolesComplete, textsOn],
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
      subtitle="A few steps to get fill-in texts."
      items={items}
      onDismiss={() => void dismiss()}
    />
  );
}
