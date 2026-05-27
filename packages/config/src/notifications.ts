/** Pingram notification type IDs — configure matching templates in the Pingram dashboard. */
export const PINGRAM_NOTIFICATION_TYPES = {
  applicationReceived: 'application_received',
  applicationReviewed: 'application_reviewed',
  applicationInProgress: 'application_in_progress',
  applicationInterviewOffered: 'application_interview_offered',
  applicationInterviewScheduled: 'application_interview_scheduled',
  applicationInterviewAccepted: 'application_interview_accepted',
  applicationInterviewDeclined: 'application_interview_declined',
  applicationInterviewCancelled: 'application_interview_cancelled',
  applicationSelected: 'application_selected',
  applicationRejected: 'application_rejected',
  applicationHired: 'application_hired',
  fillInPosted: 'fill_in_posted',
  jobPosted: 'job_posted',
} as const;

export type PingramNotificationType =
  (typeof PINGRAM_NOTIFICATION_TYPES)[keyof typeof PINGRAM_NOTIFICATION_TYPES];
