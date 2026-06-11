export const APPLICATION_UPDATE_GRACE_MS = 2_000;

export type ApplicationNotificationStatus =
  | 'screening_submitted'
  | 'applied'
  | 'reviewed'
  | 'in_progress'
  | 'interview_offered'
  | 'interview_scheduled'
  | 'selected'
  | 'rejected'
  | 'hired';

export const FILL_IN_PENDING_STATUSES: ApplicationNotificationStatus[] = [
  'applied',
  'reviewed',
  'in_progress',
  'interview_offered',
  'interview_scheduled',
];

type WorkerAttentionApplication = {
  created_at: string;
  worker_hidden_at: string | null;
  worker_attention_at: string;
  worker_last_seen_at: string | null;
};

type ClinicAttentionApplication = {
  post_type: 'job' | 'shift';
  status: ApplicationNotificationStatus | string;
  clinic_hidden_at: string | null;
  clinic_attention_at: string;
  clinic_last_seen_at: string | null;
};

export function hasWorkerApplicationClinicUpdate(
  application: Pick<WorkerAttentionApplication, 'created_at' | 'worker_hidden_at' | 'worker_attention_at'>,
): boolean {
  if (application.worker_hidden_at) return false;

  const attentionMs = new Date(application.worker_attention_at).getTime();
  const createdMs = new Date(application.created_at).getTime();
  return attentionMs - createdMs >= APPLICATION_UPDATE_GRACE_MS;
}

export function isClinicApplicationUnseen(
  application: Pick<
    ClinicAttentionApplication,
    'clinic_hidden_at' | 'clinic_attention_at' | 'clinic_last_seen_at'
  >,
): boolean {
  if (application.clinic_hidden_at) return false;

  const seenAt = application.clinic_last_seen_at;
  if (!seenAt) return true;

  return (
    new Date(application.clinic_attention_at).getTime() > new Date(seenAt).getTime()
  );
}

export function isClinicNewApplication(application: ClinicAttentionApplication): boolean {
  return (
    application.post_type === 'job' &&
    !application.clinic_hidden_at &&
    (application.status === 'applied' || application.status === 'screening_submitted') &&
    isClinicApplicationUnseen(application)
  );
}

export function isClinicNewFillInRequest(application: ClinicAttentionApplication): boolean {
  return (
    application.post_type === 'shift' &&
    !application.clinic_hidden_at &&
    FILL_IN_PENDING_STATUSES.includes(application.status as ApplicationNotificationStatus) &&
    isClinicApplicationUnseen(application)
  );
}

export function isWorkerApplicationUpdateUnseen(application: WorkerAttentionApplication): boolean {
  if (!hasWorkerApplicationClinicUpdate(application)) return false;

  const seenAt = application.worker_last_seen_at;
  if (!seenAt) return true;

  return (
    new Date(application.worker_attention_at).getTime() > new Date(seenAt).getTime()
  );
}

export function isWorkerApplicationUpdateHighlighted(application: WorkerAttentionApplication): boolean {
  if (!hasWorkerApplicationClinicUpdate(application)) return false;

  const seenAt = application.worker_last_seen_at;
  if (!seenAt) return false;

  return (
    new Date(application.worker_attention_at).getTime() > new Date(seenAt).getTime()
  );
}
