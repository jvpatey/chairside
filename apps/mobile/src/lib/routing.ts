import type { Href } from 'expo-router';

import type { UserRole } from '@/types';

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

export function getJobDetailRoute(jobId: string): Href {
  return { pathname: '/(clinic-tabs)/job/[id]', params: { id: jobId } } as Href;
}

export function getEditJobRoute(jobId: string): Href {
  return { pathname: '/(clinic-tabs)/post-job', params: { id: jobId } } as Href;
}

export function getHomeRouteForRole(role: UserRole): Href {
  return role === 'clinic' ? CLINIC_HOME : WORKER_HOME;
}
