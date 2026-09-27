export type WorkerFillInEngagementProfile = {
  short_notice_available?: boolean;
  fill_in_notification_mode?: 'off' | 'all' | 'available_days_only';
} | null;

/** Complete once fill-in alerts are actually on (or the worker already requested a fill-in). */
export function isWorkerFillInsStepComplete(params: {
  shiftApplicationCount: number;
  workerProfile?: WorkerFillInEngagementProfile;
}): boolean {
  if (params.shiftApplicationCount > 0) {
    return true;
  }

  return (
    Boolean(params.workerProfile?.short_notice_available) &&
    (params.workerProfile?.fill_in_notification_mode ?? 'off') !== 'off'
  );
}
