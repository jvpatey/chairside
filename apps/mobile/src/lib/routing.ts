import type { Href } from 'expo-router';

import type { UserRole } from '@/types';

export type FillInReturnTarget = 'postings-fill-ins' | 'dashboard-fill-ins' | 'fill-ins-tab';
export type ApplicantReturnTarget =
  | 'applications-tab'
  | 'dashboard-applications'
  | 'postings-tab'
  | 'role-history';
export type WorkerApplicationReturnTarget =
  | 'applications-tab'
  | 'dashboard-applications'
  | 'dashboard-fill-ins'
  | 'fill-ins-tab'
  | 'past-fill-ins'
  | 'messages-tab';

export type WorkerShiftReturnTarget =
  | 'fill-ins-tab'
  | 'open-fill-ins'
  | 'dashboard-fill-ins'
  | 'browse-tab';
export type ClinicApplicationReturnTarget =
  | ApplicantReturnTarget
  | 'messages-tab'
  | 'fill-ins-tab'
  | FillInReturnTarget;
export type PostingsTabParam = 'roles' | 'fill-ins';
export type DashboardOverviewParam = 'roles' | 'fill-ins' | 'applications';
export type WorkerBrowseTabParam = 'roles' | 'fill-ins';
export type WorkerDashboardOverviewParam = 'roles' | 'fill-ins' | 'applications';
export type ApplyPostType = 'job' | 'shift';

export type MessageThreadPreview = {
  conversationId: string;
  title: string;
  subtitle: string;
  scrollToMessageId?: string;
  highlightQuery?: string;
};

export type MessageThreadFocus = Pick<MessageThreadPreview, 'scrollToMessageId' | 'highlightQuery'>;

export const CLINIC_HOME: Href = '/(clinic-tabs)' as Href;
export const WORKER_HOME: Href = '/(tabs)' as Href;
export const CLINIC_SETUP_BASICS: Href = '/(clinic-setup)/basics' as Href;
export const CLINIC_SETUP_LOCATION: Href = '/(clinic-setup)/location' as Href;
export const CLINIC_SETUP_PRACTICE: Href = '/(clinic-setup)/practice' as Href;
export const CLINIC_SETUP_ABOUT: Href = '/(clinic-setup)/about' as Href;
export const CLINIC_SETUP_REVIEW: Href = '/(clinic-setup)/review' as Href;
export const WORKER_SETUP_BASICS: Href = '/(worker-setup)/basics' as Href;
export const WORKER_SETUP_EXPERIENCE: Href = '/(worker-setup)/experience' as Href;
export const WORKER_SETUP_SKILLS: Href = '/(worker-setup)/skills' as Href;
export const WORKER_SETUP_LOCATION: Href = '/(worker-setup)/location' as Href;
export const WORKER_SETUP_AVAILABILITY: Href = '/(worker-setup)/availability' as Href;
export const WORKER_SETUP_AVAILABILITY_SCHEDULE: Href =
  '/(worker-setup)/availability-schedule' as Href;
export const WORKER_SETUP_APPLICATION: Href = '/(worker-setup)/application-kit' as Href;
export const WORKER_SETUP_REVIEW: Href = '/(worker-setup)/review' as Href;
export const CLINIC_POST_JOB: Href = '/(clinic-tabs)/post-job' as Href;
export const CLINIC_POST_SHIFT: Href = '/(clinic-tabs)/post-shift' as Href;
export const CLINIC_POSTINGS: Href = '/(clinic-tabs)/postings' as Href;
export const CLINIC_FILL_INS: Href = '/(clinic-tabs)/fill-ins' as Href;
export const CLINIC_FIND_AVAILABLE_WORKERS: Href = '/(clinic-tabs)/find-available-workers' as Href;
export const CLINIC_APPLICATIONS: Href = '/(clinic-tabs)/applications' as Href;
export const CLINIC_CLINIC: Href = '/(clinic-tabs)/clinic' as Href;
export const CLINIC_PROFILE: Href = '/(clinic-tabs)/profile' as Href;
export const CLINIC_PROFILE_PRACTICE: Href = '/(clinic-tabs)/profile/practice' as Href;
export const CLINIC_PROFILE_ABOUT: Href = '/(clinic-tabs)/profile/about' as Href;
export const CLINIC_PROFILE_MESSAGING: Href = '/(clinic-tabs)/profile/messaging' as Href;
export const CLINIC_PROFILE_NOTIFICATIONS: Href = '/(clinic-tabs)/profile/notifications' as Href;
export const CLINIC_PROFILE_ACCOUNT: Href = '/(clinic-tabs)/profile/account' as Href;
export const WORKER_BROWSE: Href = '/(tabs)/browse' as Href;
export const WORKER_APPLICATIONS: Href = '/(tabs)/applications' as Href;
export const WORKER_FILLINS: Href = '/(tabs)/fillins' as Href;
export const WORKER_OPEN_FILLINS: Href = '/(tabs)/open-fill-ins' as Href;
export const WORKER_PAST_FILLINS: Href = '/(tabs)/past-fill-ins' as Href;
export const WORKER_PROFILE: Href = '/(tabs)/profile' as Href;
export const WORKER_PROFILE_PROFESSIONAL: Href = '/(tabs)/profile/professional' as Href;
export const WORKER_PROFILE_APPLICATION_KIT: Href = '/(tabs)/profile/application-kit' as Href;
export const WORKER_PROFILE_NOTIFICATIONS: Href = '/(tabs)/profile/notifications' as Href;
export const WORKER_PROFILE_ACCOUNT: Href = '/(tabs)/profile/account' as Href;

export function getClinicPostingsRoute(tab?: PostingsTabParam): Href {
  if (tab === 'fill-ins') {
    return CLINIC_FILL_INS;
  }
  return CLINIC_POSTINGS;
}

export function getFindAvailableWorkersRoute(returnTo: FillInReturnTarget = 'fill-ins-tab'): Href {
  return {
    pathname: '/(clinic-tabs)/find-available-workers',
    params: { returnTo },
  } as Href;
}

export function getClinicOutreachComposeRoute(params: {
  workerId: string;
  workerName: string;
  roleType?: string;
  smsOptIn?: boolean;
  returnTo?: FillInReturnTarget;
}): Href {
  return {
    pathname: '/(clinic-tabs)/outreach-compose',
    params: {
      returnTo: params.returnTo ?? 'fill-ins-tab',
      workerId: params.workerId,
      workerName: params.workerName,
      ...(params.roleType ? { roleType: params.roleType } : {}),
      smsOptIn: params.smsOptIn ? '1' : '0',
    },
  } as Href;
}

export function getClinicFillInsRoute(): Href {
  return CLINIC_FILL_INS;
}

export function getWorkerBrowseRoute(tab?: WorkerBrowseTabParam): Href {
  if (tab === 'fill-ins') {
    return WORKER_FILLINS;
  }
  return WORKER_BROWSE;
}

export function getClinicHomeRoute(overview?: DashboardOverviewParam): Href {
  if (overview) {
    return { pathname: '/(clinic-tabs)', params: { overview } } as Href;
  }
  return CLINIC_HOME;
}

export function getWorkerHomeRoute(overview?: WorkerDashboardOverviewParam): Href {
  if (overview) {
    return { pathname: '/(tabs)', params: { overview } } as Href;
  }
  return WORKER_HOME;
}

export function getPostShiftRoute(returnTo: FillInReturnTarget = 'fill-ins-tab'): Href {
  return { pathname: '/(clinic-tabs)/post-shift', params: { returnTo } } as Href;
}

export function getJobDetailRoute(jobId: string): Href {
  return { pathname: '/(clinic-tabs)/job/[id]', params: { id: jobId } } as Href;
}

export function getRoleHistoryRoute(): Href {
  return '/(clinic-tabs)/role-history' as Href;
}

export function getWorkerJobDetailRoute(jobId: string): Href {
  return { pathname: '/(tabs)/job/[id]', params: { id: jobId } } as unknown as Href;
}

export function getWorkerClinicProfileRoute(clinicId: string): Href {
  return { pathname: '/(tabs)/clinic/[id]', params: { id: clinicId } } as unknown as Href;
}

export function getEditJobRoute(jobId: string): Href {
  return { pathname: '/(clinic-tabs)/post-job', params: { id: jobId } } as Href;
}

export function getShiftDetailRoute(
  shiftId: string,
  returnTo: FillInReturnTarget = 'fill-ins-tab',
): Href {
  return {
    pathname: '/(clinic-tabs)/shift/[id]',
    params: { id: shiftId, returnTo },
  } as Href;
}

export function getWorkerShiftDetailRoute(
  shiftId: string,
  returnTo?: WorkerShiftReturnTarget,
): Href {
  return {
    pathname: '/(tabs)/shift/[id]',
    params: returnTo ? { id: shiftId, returnTo } : { id: shiftId },
  } as unknown as Href;
}

export function navigateAfterWorkerShift(
  router: { replace: (href: Href) => void; back: () => void; canGoBack?: () => boolean },
  returnTo?: string,
) {
  if (returnTo === 'fill-ins-tab') {
    router.replace(WORKER_FILLINS);
    return;
  }
  if (returnTo === 'open-fill-ins') {
    router.replace(WORKER_OPEN_FILLINS);
    return;
  }
  if (returnTo === 'dashboard-fill-ins') {
    router.replace(getWorkerHomeRoute('fill-ins'));
    return;
  }
  if (returnTo === 'browse-tab') {
    router.replace(WORKER_BROWSE);
    return;
  }
  if (router.canGoBack?.()) {
    router.back();
    return;
  }
  router.replace(WORKER_FILLINS);
}

export function getWorkerApplicationRoute(
  applicationId: string,
  returnTo: WorkerApplicationReturnTarget = 'applications-tab',
): Href {
  return {
    pathname: '/(tabs)/application/[id]',
    params: { id: applicationId, returnTo },
  } as unknown as Href;
}

export function getWorkerApplicationMessagesRoute(
  applicationId: string,
  returnTo: WorkerApplicationReturnTarget = 'applications-tab',
  preview?: MessageThreadPreview,
): Href {
  return {
    pathname: '/(tabs)/application/[id]/messages',
    params: {
      id: applicationId,
      returnTo,
      ...(preview
        ? {
            conversationId: preview.conversationId,
            title: preview.title,
            subtitle: preview.subtitle,
            ...(preview.scrollToMessageId
              ? { scrollToMessageId: preview.scrollToMessageId }
              : {}),
            ...(preview.highlightQuery ? { highlightQuery: preview.highlightQuery } : {}),
          }
        : {}),
    },
  } as unknown as Href;
}

export function getClinicApplicationMessagesRoute(
  applicationId: string,
  returnTo?: ClinicApplicationReturnTarget,
  preview?: MessageThreadPreview,
): Href {
  return {
    pathname: '/(clinic-tabs)/application/[id]/messages',
    params: {
      id: applicationId,
      returnTo: returnTo ?? '',
      ...(preview
        ? {
            conversationId: preview.conversationId,
            title: preview.title,
            subtitle: preview.subtitle,
            ...(preview.scrollToMessageId
              ? { scrollToMessageId: preview.scrollToMessageId }
              : {}),
            ...(preview.highlightQuery ? { highlightQuery: preview.highlightQuery } : {}),
          }
        : {}),
    },
  } as unknown as Href;
}

function normalizeApplicantReturnTarget(returnTo?: string): ApplicantReturnTarget {
  if (
    returnTo === 'applications-tab' ||
    returnTo === 'dashboard-applications' ||
    returnTo === 'postings-tab' ||
    returnTo === 'role-history'
  ) {
    return returnTo;
  }
  return 'applications-tab';
}

export function getClinicApplicationRoute(
  applicationId: string,
  returnTo?: ClinicApplicationReturnTarget,
  roleJobId?: string,
): Href {
  return {
    pathname: '/(clinic-tabs)/application/[id]',
    params: {
      id: applicationId,
      returnTo: returnTo ?? '',
      ...(roleJobId ? { roleJobId } : {}),
    },
  } as unknown as Href;
}

export function navigateAfterClinicApplication(
  router: { replace: (href: Href) => void; back: () => void; canGoBack?: () => boolean },
  returnTo?: string,
  roleJobId?: string,
) {
  if (roleJobId) {
    router.replace(
      getClinicRoleApplicationsRoute(roleJobId, normalizeApplicantReturnTarget(returnTo)),
    );
    return;
  }
  if (router.canGoBack?.()) {
    router.back();
    return;
  }
  if (returnTo === 'dashboard-applications') {
    router.replace(getClinicHomeRoute('applications'));
    return;
  }
  if (returnTo === 'postings-tab') {
    router.replace(CLINIC_POSTINGS);
    return;
  }
  if (returnTo === 'role-history') {
    router.replace(getRoleHistoryRoute());
    return;
  }
  if (
    returnTo === 'fill-ins-tab' ||
    returnTo === 'postings-fill-ins' ||
    returnTo === 'dashboard-fill-ins'
  ) {
    router.replace(getClinicFillInsRoute());
    return;
  }
  if (returnTo === 'messages-tab') {
    router.replace(getClinicMessagesRoute());
    return;
  }
  router.replace(CLINIC_APPLICATIONS);
}

export function getWorkerMessagesRoute(conversationId?: string): Href {
  if (conversationId) {
    return {
      pathname: '/(tabs)/messages',
      params: { conversationId },
    } as unknown as Href;
  }
  return '/(tabs)/messages' as Href;
}

export type WorkerMessageClinicsReturnTarget = 'messages-tab' | 'browse-tab';

export function getWorkerMessageClinicsRoute(
  returnTo: WorkerMessageClinicsReturnTarget = 'messages-tab',
): Href {
  return {
    pathname: '/(tabs)/messages/clinics',
    params: { returnTo },
  } as unknown as Href;
}

/** Roles browse entry — top-level route so the messages tab stack stays on the inbox. */
export function getWorkerClinicsDirectoryRoute(
  returnTo: WorkerMessageClinicsReturnTarget = 'browse-tab',
): Href {
  return {
    pathname: '/(tabs)/message-clinics',
    params: { returnTo },
  } as unknown as Href;
}

export function navigateAfterWorkerMessageClinics(
  router: { replace: (href: Href) => void; back: () => void; canGoBack?: () => boolean },
  returnTo?: string,
) {
  if (returnTo === 'browse-tab') {
    router.replace(WORKER_BROWSE);
    return;
  }
  if (returnTo === 'messages-tab') {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }
    router.replace(getWorkerMessagesRoute());
    return;
  }
  if (router.canGoBack?.()) {
    router.back();
    return;
  }
  router.replace(getWorkerMessagesRoute());
}

export function getWorkerConversationRoute(
  conversationId: string,
  preview?: MessageThreadPreview,
): Href {
  return {
    pathname: '/(tabs)/conversation/[id]',
    params: {
      id: conversationId,
      ...(preview
        ? {
            conversationId: preview.conversationId,
            title: preview.title,
            subtitle: preview.subtitle,
            ...(preview.scrollToMessageId
              ? { scrollToMessageId: preview.scrollToMessageId }
              : {}),
            ...(preview.highlightQuery ? { highlightQuery: preview.highlightQuery } : {}),
          }
        : {}),
    },
  } as unknown as Href;
}

export function getClinicConversationRoute(
  conversationId: string,
  preview?: MessageThreadPreview,
): Href {
  return {
    pathname: '/(clinic-tabs)/conversation/[id]',
    params: {
      id: conversationId,
      ...(preview
        ? {
            conversationId: preview.conversationId,
            title: preview.title,
            subtitle: preview.subtitle,
            ...(preview.scrollToMessageId
              ? { scrollToMessageId: preview.scrollToMessageId }
              : {}),
            ...(preview.highlightQuery ? { highlightQuery: preview.highlightQuery } : {}),
          }
        : {}),
    },
  } as unknown as Href;
}

export function getConversationMessagesRoute(
  conversation: Pick<
    import('@chairside/api').Conversation,
    'id' | 'conversation_type' | 'application_id'
  >,
  role: 'worker' | 'clinic',
  preview?: MessageThreadPreview,
  returnTo?: WorkerApplicationReturnTarget | ClinicApplicationReturnTarget,
): Href {
  const threadPreview = preview ?? {
    conversationId: conversation.id,
    title: '',
    subtitle: '',
  };

  if (
    conversation.conversation_type === 'general' ||
    conversation.conversation_type === 'outreach' ||
    !conversation.application_id
  ) {
    return role === 'worker'
      ? getWorkerConversationRoute(conversation.id, threadPreview)
      : getClinicConversationRoute(conversation.id, threadPreview);
  }

  return role === 'worker'
    ? getWorkerApplicationMessagesRoute(
        conversation.application_id,
        (returnTo as WorkerApplicationReturnTarget) ?? 'messages-tab',
        threadPreview,
      )
    : getClinicApplicationMessagesRoute(
        conversation.application_id,
        (returnTo as ClinicApplicationReturnTarget) ?? 'messages-tab',
        threadPreview,
      );
}

export function getClinicMessagesRoute(): Href {
  return '/(clinic-tabs)/messages' as Href;
}

export function getClinicShiftApplicantsRoute(
  shiftId: string,
  returnTo: FillInReturnTarget = 'fill-ins-tab',
): Href {
  return {
    pathname: '/(clinic-tabs)/shift-applicants/[shiftId]',
    params: { shiftId, returnTo },
  } as Href;
}

export function navigateAfterMessageThread(
  router: { replace: (href: Href) => void },
  role: 'worker' | 'clinic',
) {
  router.replace(role === 'clinic' ? getClinicMessagesRoute() : getWorkerMessagesRoute());
}

export function navigateAfterWorkerApplication(
  router: { replace: (href: Href) => void; back: () => void },
  returnTo?: string,
) {
  if (returnTo === 'dashboard-applications') {
    router.replace(getWorkerHomeRoute('applications'));
    return;
  }
  if (returnTo === 'dashboard-fill-ins') {
    router.replace(getWorkerHomeRoute('fill-ins'));
    return;
  }
  if (returnTo === 'fill-ins-tab') {
    router.replace(WORKER_FILLINS);
    return;
  }
  if (returnTo === 'past-fill-ins') {
    router.replace(WORKER_PAST_FILLINS);
    return;
  }
  if (returnTo === 'messages-tab') {
    router.replace(getWorkerMessagesRoute());
    return;
  }
  router.replace(WORKER_APPLICATIONS);
}

export function getApplyRoute(postType: ApplyPostType, postId: string): Href {
  return { pathname: '/(tabs)/apply', params: { postType, postId } } as unknown as Href;
}

export function getApplyScreeningRoute(postId: string): Href {
  return {
    pathname: '/(tabs)/apply-screening',
    params: { postId },
  } as unknown as Href;
}

export function getClinicRoleApplicationsRoute(
  jobId: string,
  returnTo: ApplicantReturnTarget = 'applications-tab',
): Href {
  return {
    pathname: '/(clinic-tabs)/role-applicants/[jobId]',
    params: { jobId, returnTo },
  } as Href;
}

export function navigateAfterRoleApplicants(
  router: { replace: (href: Href) => void; back: () => void; canGoBack?: () => boolean },
  returnTo?: string,
) {
  if (router.canGoBack?.()) {
    router.back();
    return;
  }
  if (returnTo === 'dashboard-applications') {
    router.replace(getClinicHomeRoute('applications'));
    return;
  }
  if (returnTo === 'postings-tab') {
    router.replace(CLINIC_POSTINGS);
    return;
  }
  if (returnTo === 'role-history') {
    router.replace(getRoleHistoryRoute());
    return;
  }
  router.replace(CLINIC_APPLICATIONS);
}

export function getEditShiftRoute(
  shiftId: string,
  returnTo: FillInReturnTarget = 'fill-ins-tab',
): Href {
  return {
    pathname: '/(clinic-tabs)/post-shift',
    params: { id: shiftId, returnTo },
  } as Href;
}

export function getFillInReturnRoute(returnTo?: string): Href {
  if (returnTo === 'dashboard-fill-ins') {
    return getClinicHomeRoute('fill-ins');
  }
  return CLINIC_FILL_INS;
}

export function navigateAfterFillInSave(
  router: { replace: (href: Href) => void },
  returnTo?: string,
) {
  router.replace(getFillInReturnRoute(returnTo));
}

export function getHomeRouteForRole(role: UserRole): Href {
  return role === 'clinic' ? CLINIC_HOME : WORKER_HOME;
}
