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
  applicationInterviewRescheduleProposed: 'application_interview_reschedule_proposed',
  applicationInterviewRescheduleAccepted: 'application_interview_reschedule_accepted',
  applicationInterviewRescheduleDeclined: 'application_interview_reschedule_declined',
  applicationInterviewScheduledCancelled: 'application_interview_scheduled_cancelled',
  applicationSelected: 'application_selected',
  applicationRejected: 'application_rejected',
  applicationHired: 'application_hired',
  fillInPosted: 'fill_in_posted',
  jobPosted: 'job_posted',
  messageReceived: 'message_received',
} as const;

export type PingramNotificationType =
  (typeof PINGRAM_NOTIFICATION_TYPES)[keyof typeof PINGRAM_NOTIFICATION_TYPES];

/** User-facing push notification preference categories. */
export const NOTIFICATION_PREFERENCE_CATEGORIES = {
  messages: 'messages',
  applicationsInterviews: 'applications_interviews',
  jobAlerts: 'job_alerts',
  fillInAlerts: 'fill_in_alerts',
} as const;

export type NotificationPreferenceCategory =
  (typeof NOTIFICATION_PREFERENCE_CATEGORIES)[keyof typeof NOTIFICATION_PREFERENCE_CATEGORIES];

export const NOTIFICATION_PREFERENCE_CATEGORY_LABELS: Record<
  NotificationPreferenceCategory,
  { title: string; hint: string }
> = {
  messages: {
    title: 'Messages',
    hint: 'Push when someone sends you a new message.',
  },
  applications_interviews: {
    title: 'Applications & interviews',
    hint: 'Push for application updates, interview invitations, and hiring decisions.',
  },
  job_alerts: {
    title: 'New job alerts',
    hint: 'Push when a clinic posts a live role matching your position.',
  },
  fill_in_alerts: {
    title: 'Fill-in alerts',
    hint: 'Push when a clinic posts a fill-in shift you may be eligible for.',
  },
};
