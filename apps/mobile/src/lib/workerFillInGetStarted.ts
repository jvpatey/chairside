export type WorkerFillInEngagementProfile = {
  short_notice_available?: boolean;
  fill_in_notification_mode?: 'off' | 'all' | 'available_days_only';
} | null;

export function isWorkerFillInsStepComplete(params: {
  shiftApplicationCount: number;
  visitedFillIns: boolean;
  workerProfile?: WorkerFillInEngagementProfile;
  availabilityBlockCount?: number;
  savedShiftCount?: number;
}): boolean {
  if (params.shiftApplicationCount > 0 || params.visitedFillIns) {
    return true;
  }

  if ((params.savedShiftCount ?? 0) > 0) {
    return true;
  }

  if (Boolean(params.workerProfile?.short_notice_available)) {
    return true;
  }

  if ((params.availabilityBlockCount ?? 0) > 0) {
    return true;
  }

  return (params.workerProfile?.fill_in_notification_mode ?? 'off') !== 'off';
}
