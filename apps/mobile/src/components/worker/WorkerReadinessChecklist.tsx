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
  WORKER_FINISH_PROFILE,
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
  const smsStatus = getFillInSmsStatus(workerProfile);
  const textsOn = smsStatus.smsActive;
  const profileComplete = isWorkerProfileComplete(workerProfile);
  const needsPhone = !workerProfile?.phone?.trim();

  const items = useMemo<GetStartedChecklistItem[]>(
    () => [
      {
        id: 'profile',
        title: profileComplete
          ? 'Profile ready'
          : needsPhone
            ? 'Add a mobile number for text alerts'
            : 'Add role, phone, and city',
        body: profileComplete
          ? 'Enough to match you to nearby fill-ins.'
          : needsPhone
            ? 'Fill-in openings are sent by SMS — add your phone so you don’t miss them.'
            : 'Role and city help show the right jobs; phone enables fill-in texts.',
        complete: profileComplete,
        primary: !profileComplete,
        onPress: () => router.push(WORKER_FINISH_PROFILE),
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
              : needsPhone
                ? WORKER_FINISH_PROFILE
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
    [
      fillInsComplete,
      jobApplicationCount,
      needsPhone,
      profileComplete,
      rolesComplete,
      textsOn,
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
      subtitle={
        profileComplete
          ? 'A few steps to get fill-in texts.'
          : needsPhone
            ? 'Fill-ins are alerted by SMS — add your mobile number when you’re ready.'
            : 'Finish your profile when you’re ready — role, phone, and city on one form.'
      }
      items={items}
      onDismiss={() => void dismiss()}
    />
  );
}
