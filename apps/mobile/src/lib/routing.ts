import type { Href } from 'expo-router';

import type { UserRole } from '@/types';

export type FillInReturnTarget = 'postings-fill-ins' | 'dashboard-fill-ins';
export type PostingsTabParam = 'roles' | 'fill-ins';
export type DashboardOverviewParam = 'roles' | 'fill-ins' | 'applications';

export const CLINIC_HOME: Href = '/(clinic-tabs)' as Href;
export const WORKER_HOME: Href = '/(tabs)' as Href;
export const CLINIC_SETUP_BASICS: Href = '/(clinic-setup)/basics' as Href;
export const CLINIC_SETUP_LOCATION: Href = '/(clinic-setup)/location' as Href;
export const CLINIC_SETUP_PRACTICE: Href = '/(clinic-setup)/practice' as Href;
export const CLINIC_SETUP_ABOUT: Href = '/(clinic-setup)/about' as Href;
export const CLINIC_SETUP_REVIEW: Href = '/(clinic-setup)/review' as Href;
export const CLINIC_POST_JOB: Href = '/(clinic-tabs)/post-job' as Href;
export const CLINIC_POST_SHIFT: Href = '/(clinic-tabs)/post-shift' as Href;
export const CLINIC_POSTINGS: Href = '/(clinic-tabs)/postings' as Href;
export const CLINIC_APPLICATIONS: Href = '/(clinic-tabs)/applications' as Href;
export const CLINIC_CLINIC: Href = '/(clinic-tabs)/clinic' as Href;
export const CLINIC_PROFILE: Href = '/(clinic-tabs)/profile' as Href;

export function getClinicPostingsRoute(tab?: PostingsTabParam): Href {
  if (tab === 'fill-ins') {
    return { pathname: '/(clinic-tabs)/postings', params: { tab: 'fill-ins' } } as Href;
  }
  return CLINIC_POSTINGS;
}

export function getClinicHomeRoute(overview?: DashboardOverviewParam): Href {
  if (overview) {
    return { pathname: '/(clinic-tabs)', params: { overview } } as Href;
  }
  return CLINIC_HOME;
}

export function getPostShiftRoute(returnTo: FillInReturnTarget = 'postings-fill-ins'): Href {
  return { pathname: '/(clinic-tabs)/post-shift', params: { returnTo } } as Href;
}

export function getJobDetailRoute(jobId: string): Href {
  return { pathname: '/(clinic-tabs)/job/[id]', params: { id: jobId } } as Href;
}

export function getEditJobRoute(jobId: string): Href {
  return { pathname: '/(clinic-tabs)/post-job', params: { id: jobId } } as Href;
}

export function getShiftDetailRoute(
  shiftId: string,
  returnTo: FillInReturnTarget = 'postings-fill-ins',
): Href {
  return {
    pathname: '/(clinic-tabs)/shift/[id]',
    params: { id: shiftId, returnTo },
  } as Href;
}

export function getEditShiftRoute(
  shiftId: string,
  returnTo: FillInReturnTarget = 'postings-fill-ins',
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
  router.replace(getClinicPostingsRoute('fill-ins'));
}

export function getHomeRouteForRole(role: UserRole): Href {
  return role === 'clinic' ? CLINIC_HOME : WORKER_HOME;
}
