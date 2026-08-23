import type { ClinicProfile } from '@chairside/api';
import { isClinicProfileComplete, type ClinicProfileCompletenessLocation } from '@chairside/api';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useMemo } from 'react';

import { GetStartedChecklistCard } from '@/components/dashboard/GetStartedChecklistCard';
import { useDismissedGetStartedChecklist } from '@/hooks/useDismissedGetStartedChecklist';
import {
  areAllGetStartedItemsComplete,
  isClinicEngagementStepComplete,
  isClinicPostingStepComplete,
  type GetStartedChecklistItem,
} from '@/lib/getStartedChecklist';
import {
  CLINIC_APPLICATIONS,
  CLINIC_SETUP_BASICS,
  getClinicMessagesRoute,
} from '@/lib/routing';

type ClinicReadinessChecklistProps = {
  clinicProfile: ClinicProfile | null;
  locations?: ClinicProfileCompletenessLocation[];
  fillInsPosted: number;
  openRoles: number;
  totalApplications: number;
  conversationCount: number;
  onPostFillIn: () => void;
  onPostRole: () => void;
};

export function ClinicReadinessChecklist({
  clinicProfile,
  locations,
  fillInsPosted,
  openRoles,
  totalApplications,
  conversationCount,
  onPostFillIn,
  onPostRole,
}: ClinicReadinessChecklistProps) {
  const { isHydrated, isDismissed, dismiss } = useDismissedGetStartedChecklist('clinic');

  const profileComplete = isClinicProfileComplete(clinicProfile, { locations });
  const hasPosted = isClinicPostingStepComplete({ fillInsPosted, openRoles });
  const hasPostedFillIn = fillInsPosted > 0;
  const hasPostedRole = openRoles > 0;
  const hasEngagement = isClinicEngagementStepComplete({ totalApplications, conversationCount });

  const postingTitle = hasPosted
    ? hasPostedRole && hasPostedFillIn
      ? 'Role and fill-in posted'
      : hasPostedRole
        ? 'Role posted'
        : 'Fill-in shift posted'
    : 'Post a role or fill-in';

  const postingBody = hasPosted
    ? hasPostedRole && hasPostedFillIn
      ? 'You have permanent and temporary postings live.'
      : hasPostedRole
        ? 'You have at least one role listing live.'
        : 'You have at least one fill-in shift live.'
    : 'Hire for a permanent role or cover a temporary shift.';

  const items = useMemo<GetStartedChecklistItem[]>(
    () => [
      {
        id: 'profile',
        title: profileComplete ? 'Clinic profile complete' : 'Complete your clinic profile to post',
        body: profileComplete
          ? 'Your practice details are ready for workers.'
          : 'Add your practice details so workers know who they are applying to.',
        complete: profileComplete,
        primary: !profileComplete,
        onPress: () => router.push(CLINIC_SETUP_BASICS),
      },
      {
        id: 'posting',
        title: postingTitle,
        body: postingBody,
        complete: hasPosted,
        primary: profileComplete && !hasPosted,
        onPress: () => {
          // Prefer the path they haven't tried yet; default to posting a role.
          if (!hasPostedRole) {
            onPostRole();
            return;
          }
          onPostFillIn();
        },
      },
      {
        id: 'review',
        title: hasEngagement ? 'Applications in progress' : 'Review applications and messages',
        body: hasEngagement
          ? 'Applicants and conversations are waiting for you.'
          : 'Respond to applicants and keep hiring moving.',
        complete: hasEngagement,
        onPress: () => {
          const target: Href =
            totalApplications > 0 ? CLINIC_APPLICATIONS : getClinicMessagesRoute();
          router.push(target);
        },
      },
    ],
    [
      hasEngagement,
      hasPosted,
      hasPostedFillIn,
      hasPostedRole,
      onPostFillIn,
      onPostRole,
      postingBody,
      postingTitle,
      profileComplete,
      totalApplications,
    ],
  );

  if (!isHydrated || isDismissed || areAllGetStartedItemsComplete(items)) {
    return null;
  }

  return (
    <GetStartedChecklistCard
      subtitle="Finish these steps to start hiring on Chairside."
      items={items}
      onDismiss={() => void dismiss()}
    />
  );
}
