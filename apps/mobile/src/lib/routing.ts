import type { Href } from 'expo-router';

import type { UserRole } from '@/types';

export type FillInReturnTarget = 'postings-fill-ins' | 'dashboard-fill-ins' | 'fill-ins-tab';
export type ApplicantReturnTarget = 'applications-tab' | 'dashboard-applications';
export type WorkerApplicationReturnTarget =
  | 'applications-tab'
  | 'dashboard-applications'
  | 'fill-ins-tab'
  | 'messages-tab';
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
};

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
export const CLINIC_APPLICATIONS: Href = '/(clinic-tabs)/applications' as Href;
export const CLINIC_CLINIC: Href = '/(clinic-tabs)/clinic' as Href;
export const CLINIC_PROFILE: Href = '/(clinic-tabs)/profile' as Href;
export const WORKER_BROWSE: Href = '/(tabs)/browse' as Href;
export const WORKER_APPLICATIONS: Href = '/(tabs)/applications' as Href;
export const WORKER_FILLINS: Href = '/(tabs)/fillins' as Href;
export const WORKER_OPEN_FILLINS: Href = '/(tabs)/open-fill-ins' as Href;
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

export function getWorkerShiftDetailRoute(shiftId: string): Href {
  return { pathname: '/(tabs)/shift/[id]', params: { id: shiftId } } as unknown as Href;
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
          }
        : {}),
    },
  } as unknown as Href;
}

export function getWorkerMessagesRoute(): Href {
  return '/(tabs)/messages' as Href;
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

export function navigateAfterMessageThread(router: { replace: (href: Href) => void }, role: 'worker' | 'clinic') {
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
  if (returnTo === 'fill-ins-tab') {
    router.replace(WORKER_FILLINS);
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

export function getApplyScreeningRoute(postId: string, coverMessage?: string): Href {
  return {
    pathname: '/(tabs)/apply-screening',
    params: { postId, coverMessage: coverMessage ?? '' },
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
  router: { replace: (href: Href) => void; back: () => void },
  returnTo?: string,
) {
  if (returnTo === 'dashboard-applications') {
    router.replace(getClinicHomeRoute('applications'));
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

export function navigateAfterFillInSave(
  router: { replace: (href: Href) => void },
  returnTo?: string,
) {
  if (returnTo === 'dashboard-fill-ins') {
    router.replace(getClinicHomeRoute('fill-ins'));
    return;
  }
  if (returnTo === 'postings-fill-ins') {
    router.replace(CLINIC_FILL_INS);
    return;
  }
  router.replace(CLINIC_FILL_INS);
}

export function getHomeRouteForRole(role: UserRole): Href {
  return role === 'clinic' ? CLINIC_HOME : WORKER_HOME;
}
