/** Pingram notification type IDs — configure matching templates in the Pingram dashboard. */
export const PINGRAM_NOTIFICATION_TYPES = {
  applicationReceived: 'application_received',
  applicationReviewed: 'application_reviewed',
  applicationRejected: 'application_rejected',
  applicationHired: 'application_hired',
  fillInPosted: 'fill_in_posted',
  jobPosted: 'job_posted',
} as const;

export type PingramNotificationType =
  (typeof PINGRAM_NOTIFICATION_TYPES)[keyof typeof PINGRAM_NOTIFICATION_TYPES];
