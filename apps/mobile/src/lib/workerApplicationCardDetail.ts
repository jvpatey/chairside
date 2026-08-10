import type { WorkerApplication } from '@chairside/api';
import {
  formatApplicationStatus,
  formatInterviewDateTime,
  formatWorkerShiftApplicationStatus,
  isAwaitingApplicationKit,
} from '@chairside/config';

import {
  getApplicationStatusSummary,
  type ApplicationStatusSummaryInput,
} from '@/lib/applicationStatusSummary';
import { getWorkerShiftApplicationCardDisplay } from '@/lib/workerShiftApplicationDisplay';

type WorkerApplicationCardDetailInput = Pick<
  WorkerApplication,
  | 'status'
  | 'post_type'
  | 'application_kit_requested_at'
  | 'application_kit_submitted_at'
  | 'interview_at'
  | 'interview_duration_minutes'
  | 'interview_proposed_at'
  | 'interview_proposed_duration_minutes'
  | 'interview_proposed_by'
  | 'status_note'
  | 'status_closed_by'
  | 'clinic_account_deleted'
  | 'shift_date'
  | 'shift_start_time'
  | 'shift_end_time'
  | 'post_title'
  | 'post_role_type'
  | 'role_type'
  | 'clinic_location'
  | 'clinic_address'
  | 'clinic_city'
  | 'clinic_province'
>;

function toStatusSummaryInput(
  application: WorkerApplicationCardDetailInput,
): ApplicationStatusSummaryInput {
  return {
    status: application.status,
    postType: application.post_type,
    applicationKitRequestedAt: application.application_kit_requested_at,
    applicationKitSubmittedAt: application.application_kit_submitted_at,
    interviewProposedAt: application.interview_proposed_at,
    interviewProposedBy: application.interview_proposed_by,
    statusNote: application.status_note,
    statusClosedBy: application.status_closed_by,
    clinicAccountDeleted: application.clinic_account_deleted,
  };
}

function formatInterviewDetail(application: WorkerApplicationCardDetailInput): string | null {
  const interviewAt =
    application.status === 'interview_scheduled' || application.status === 'interview_offered'
      ? application.interview_at
      : null;
  const interviewDuration =
    application.status === 'interview_scheduled' || application.status === 'interview_offered'
      ? application.interview_duration_minutes
      : null;
  const interviewSummary = interviewAt
    ? formatInterviewDateTime(interviewAt, interviewDuration)
    : null;

  if (application.status === 'interview_offered' && application.interview_proposed_at) {
    const suggested = formatInterviewDateTime(
      application.interview_proposed_at,
      application.interview_proposed_duration_minutes,
    );
    if (suggested) {
      return interviewSummary
        ? `Suggested ${suggested} · clinic invite ${interviewSummary}`
        : `Suggested ${suggested}`;
    }
  }

  return interviewSummary ? `Interview ${interviewSummary}` : null;
}

export function getWorkerApplicationCardDetail(
  application: WorkerApplicationCardDetailInput,
  options?: { isHighlighted?: boolean },
): string | null {
  const isShift = application.post_type === 'shift';
  const isCancelledShift =
    isShift && application.status === 'rejected' && Boolean(application.status_closed_by);

  if (isShift) {
    const shiftDisplay = getWorkerShiftApplicationCardDisplay(
      application as WorkerApplication,
    );
    const parts = [
      shiftDisplay.shiftSchedule,
      isCancelledShift ? application.status_note?.trim() : null,
    ].filter(Boolean);

    return parts.length ? parts.join(' · ') : null;
  }

  const interviewDetail = formatInterviewDetail(application);
  if (interviewDetail) return interviewDetail;

  if (
    isAwaitingApplicationKit({
      status: application.status,
      application_kit_requested_at: application.application_kit_requested_at,
      application_kit_submitted_at: application.application_kit_submitted_at,
    })
  ) {
    return 'Submit application profile';
  }

  const summary = getApplicationStatusSummary(
    toStatusSummaryInput(application),
    'worker',
    options,
  );
  return summary?.nextStep ?? null;
}

export function getWorkerApplicationCardStatusLabel(
  application: WorkerApplicationCardDetailInput,
  options?: { isHighlighted?: boolean },
): string {
  const summary = getApplicationStatusSummary(
    toStatusSummaryInput(application),
    'worker',
    options,
  );
  if (summary?.headline) return summary.headline;

  if (application.post_type === 'shift') {
    return formatWorkerShiftApplicationStatus({
      status: application.status,
      status_note: application.status_note,
      status_closed_by: application.status_closed_by,
    });
  }

  return formatApplicationStatus(application.status, application.post_type);
}

export function formatWorkerApplicationCardLocation(
  application: WorkerApplicationCardDetailInput,
): string | null {
  if (application.post_type === 'shift') {
    return getWorkerShiftApplicationCardDisplay(application as WorkerApplication).location;
  }

  const city = application.clinic_city?.trim();
  const province = application.clinic_province?.trim();
  if (city && province) return `${city}, ${province}`;
  return city ?? province ?? null;
}
