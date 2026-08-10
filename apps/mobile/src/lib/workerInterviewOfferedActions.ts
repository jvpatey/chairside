export type WorkerInterviewOfferedActionKey =
  | 'accept-interview'
  | 'suggest-time'
  | 'edit-suggestion'
  | 'decline-interview';

/**
 * Pure action keys for a pending interview invite (`interview_offered`).
 * While a worker counter-proposal is pending, hide Accept on the original slot.
 */
export function getWorkerInterviewOfferedActionKeys(input: {
  hasInterviewSummary: boolean;
  workerProposedChange: boolean;
}): WorkerInterviewOfferedActionKey[] {
  if (!input.hasInterviewSummary) return [];

  if (input.workerProposedChange) {
    return ['edit-suggestion', 'decline-interview'];
  }

  return ['accept-interview', 'suggest-time', 'decline-interview'];
}
