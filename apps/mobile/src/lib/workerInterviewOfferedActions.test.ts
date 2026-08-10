import { describe, expect, it } from 'vitest';

import { getWorkerInterviewOfferedActionKeys } from './workerInterviewOfferedActions';

describe('getWorkerInterviewOfferedActionKeys', () => {
  it('returns accept, suggest, and decline when invite has no counter yet', () => {
    expect(
      getWorkerInterviewOfferedActionKeys({
        hasInterviewSummary: true,
        workerProposedChange: false,
      }),
    ).toEqual(['accept-interview', 'suggest-time', 'decline-interview']);
  });

  it('hides accept and exposes edit while a worker suggestion is pending', () => {
    expect(
      getWorkerInterviewOfferedActionKeys({
        hasInterviewSummary: true,
        workerProposedChange: true,
      }),
    ).toEqual(['edit-suggestion', 'decline-interview']);
  });

  it('returns no actions without an interview summary', () => {
    expect(
      getWorkerInterviewOfferedActionKeys({
        hasInterviewSummary: false,
        workerProposedChange: false,
      }),
    ).toEqual([]);
  });
});
