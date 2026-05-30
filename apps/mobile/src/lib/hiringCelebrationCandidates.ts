import type { WorkerApplication } from '@chairside/api';

type CelebrationCandidate = {
  id: string;
  postType: 'job' | 'shift';
  status: string;
  counterpartName: string;
  postTitle: string;
  shiftDateLabel?: string | null;
  updatedAt?: string;
};

export function toJobCelebrationCandidates(
  applications: WorkerApplication[],
): CelebrationCandidate[] {
  return applications.map((application) => ({
    id: application.id,
    postType: 'job',
    status: application.status,
    counterpartName: application.clinic_name,
    postTitle: application.post_title,
    updatedAt: application.updated_at,
  }));
}

export function toShiftCelebrationCandidates(
  applications: WorkerApplication[],
): CelebrationCandidate[] {
  return applications.map((application) => ({
    id: application.id,
    postType: 'shift',
    status: application.status,
    counterpartName: application.clinic_name,
    postTitle: application.post_title,
    updatedAt: application.updated_at,
  }));
}

export function toCelebrationCandidate(
  application: WorkerApplication,
): CelebrationCandidate {
  return application.post_type === 'shift'
    ? toShiftCelebrationCandidates([application])[0]
    : toJobCelebrationCandidates([application])[0];
}
