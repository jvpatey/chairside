import type { ClinicProfile } from '@chairside/api';
import { isClinicProfileComplete } from '@chairside/api';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useMemo } from 'react';

import { GetStartedChecklistCard } from '@/components/dashboard/GetStartedChecklistCard';
import { useDismissedGetStartedChecklist } from '@/hooks/useDismissedGetStartedChecklist';
import {
  areAllGetStartedItemsComplete,
  isClinicEngagementStepComplete,
  type GetStartedChecklistItem,
} from '@/lib/getStartedChecklist';
import {
  CLINIC_APPLICATIONS,
  CLINIC_MESSAGES,
  CLINIC_POST_JOB,
  CLINIC_SETUP_BASICS,
} from '@/lib/routing';

type ClinicReadinessChecklistProps = {
  clinicProfile: ClinicProfile | null;
  fillInsPosted: number;
  openRoles: number;
  totalApplications: number;
  conversationCount: number;
  onPostFillIn: () => void;
  onPostRole: () => void;
};

export function ClinicReadinessChecklist({
  clinicProfile,
  fillInsPosted,
  openRoles,
  totalApplications,
  conversationCount,
  onPostFillIn,
  onPostRole,
}: ClinicReadinessChecklistProps) {
  const { isHydrated, isDismissed, dismiss } = useDismissedGetStartedChecklist('clinic');

  const profileComplete = isClinicProfileComplete(clinicProfile);
  const hasPostedFillIn = fillInsPosted > 0;
  const hasPostedRole = openRoles > 0;
  const hasEngagement = isClinicEngagementStepComplete({ totalApplications, conversationCount });

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
        id: 'post-fill-in',
        title: hasPostedFillIn ? 'Fill-in shift posted' : 'Post a fill-in shift',
        body: hasPostedFillIn
          ? 'You have at least one fill-in shift live.'
          : 'Cover temporary or urgent shifts with available workers.',
        complete: hasPostedFillIn,
        onPress: onPostFillIn,
      },
      {
        id: 'post-role',
        title: hasPostedRole ? 'Role posted' : 'Post a role',
        body: hasPostedRole
          ? 'You have at least one role listing live.'
          : 'Hire for full-time or part-time positions.',
        complete: hasPostedRole,
        onPress: onPostRole,
      },
      {
        id: 'review',
        title: hasEngagement ? 'Applications in progress' : 'Review applications and messages',
        body: hasEngagement
          ? 'Applicants and conversations are waiting for you.'
          : 'Respond to applicants and keep hiring moving.',
        complete: hasEngagement,
        onPress: () => {
          const target: Href = totalApplications > 0 ? CLINIC_APPLICATIONS : CLINIC_MESSAGES;
          router.push(target);
        },
      },
    ],
    [
      hasEngagement,
      hasPostedFillIn,
      hasPostedRole,
      onPostFillIn,
      onPostRole,
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
