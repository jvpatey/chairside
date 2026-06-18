import type { WorkerProfile } from '@chairside/api';
import { isClinicProfileComplete, isWorkerProfileComplete } from '@chairside/api';

export const GET_STARTED_DISMISS_KEYS = {
  worker: 'chairside.getStarted.worker.dismissed.v1',
  clinic: 'chairside.getStarted.clinic.dismissed.v1',
} as const;

export const GET_STARTED_BROWSE_KEYS = {
  roles: 'chairside.getStarted.worker.visitedRoles.v1',
  fillIns: 'chairside.getStarted.worker.visitedFillIns.v1',
} as const;

export type GetStartedRole = keyof typeof GET_STARTED_DISMISS_KEYS;

export type WorkerBrowseSection = keyof typeof GET_STARTED_BROWSE_KEYS;

export type GetStartedChecklistItem = {
  id: string;
  title: string;
  body: string;
  complete: boolean;
  primary?: boolean;
  onPress: () => void;
};

export function isWorkerApplicationKitStarted(profile: WorkerProfile | null): boolean {
  if (!profile) return false;

  return Boolean(
    profile.resume_storage_path ||
      profile.photo_storage_path ||
      profile.default_cover_message?.trim(),
  );
}

export function isWorkerRolesStepComplete(params: {
  jobApplicationCount: number;
  visitedRoles: boolean;
}): boolean {
  return params.jobApplicationCount > 0 || params.visitedRoles;
}

export function isWorkerFillInsStepComplete(params: {
  shiftApplicationCount: number;
  visitedFillIns: boolean;
}): boolean {
  return params.shiftApplicationCount > 0 || params.visitedFillIns;
}

export function isClinicPostingStepComplete(params: {
  fillInsPosted: number;
  openRoles: number;
}): boolean {
  return params.fillInsPosted > 0 || params.openRoles > 0;
}

export function isClinicEngagementStepComplete(params: {
  totalApplications: number;
  conversationCount: number;
}): boolean {
  return params.totalApplications > 0 || params.conversationCount > 0;
}

export function isWorkerGetStartedComplete(params: {
  workerProfile: WorkerProfile | null;
  jobApplicationCount: number;
  shiftApplicationCount: number;
  visitedRoles: boolean;
  visitedFillIns: boolean;
}): boolean {
  return (
    isWorkerProfileComplete(params.workerProfile) &&
    isWorkerApplicationKitStarted(params.workerProfile) &&
    isWorkerRolesStepComplete({
      jobApplicationCount: params.jobApplicationCount,
      visitedRoles: params.visitedRoles,
    }) &&
    isWorkerFillInsStepComplete({
      shiftApplicationCount: params.shiftApplicationCount,
      visitedFillIns: params.visitedFillIns,
    })
  );
}

export function isClinicGetStartedComplete(params: {
  clinicProfile: Parameters<typeof isClinicProfileComplete>[0];
  fillInsPosted: number;
  openRoles: number;
  totalApplications: number;
  conversationCount: number;
}): boolean {
  return (
    isClinicProfileComplete(params.clinicProfile) &&
    params.fillInsPosted > 0 &&
    params.openRoles > 0 &&
    isClinicEngagementStepComplete({
      totalApplications: params.totalApplications,
      conversationCount: params.conversationCount,
    })
  );
}

export function areAllGetStartedItemsComplete(items: GetStartedChecklistItem[]): boolean {
  return items.length > 0 && items.every((item) => item.complete);
}
