import type { WorkerApplication } from '@chairside/api';
import { describe, expect, it } from 'vitest';

import {
  getWorkerOpenListExcludedShiftIds,
  isFillInsTabMode,
  partitionWorkerShiftApplications,
  resolveWorkerFillInsTabMode,
} from '@/lib/fillInFilters';

function makeApplication(
  overrides: Partial<WorkerApplication> & Pick<WorkerApplication, 'id' | 'status' | 'shift_date'>,
): WorkerApplication {
  return {
    job_post_id: null,
    shift_post_id: 'shift-1',
    clinic_id: 'clinic-1',
    clinic_name: 'Dental Clinic',
    post_title: 'Dental Hygienist',
    created_at: '2026-08-09T12:00:00.000Z',
    updated_at: '2026-08-09T12:00:00.000Z',
    status_note: null,
    status_closed_by: null,
    cover_message: null,
    interview_at: null,
    interview_timezone: null,
    interview_location: null,
    interview_notes: null,
    interview_proposed_at: null,
    interview_proposed_by: null,
    interview_proposed_timezone: null,
    interview_proposed_location: null,
    interview_proposed_notes: null,
    interview_proposal_message: null,
    worker_id: 'worker-1',
    worker_name: 'Jeffrey',
    ...overrides,
  } as WorkerApplication;
}

describe('partitionWorkerShiftApplications', () => {
  it('puts cover requests in upcomingInProgress, not confirmed', () => {
    const applied = makeApplication({
      id: 'app-applied',
      status: 'applied',
      shift_date: '2099-01-15',
    });
    const hired = makeApplication({
      id: 'app-hired',
      status: 'hired',
      shift_date: '2099-01-16',
    });

    const result = partitionWorkerShiftApplications([applied, hired]);

    expect(result.upcomingInProgress.map((row) => row.id)).toEqual(['app-applied']);
    expect(result.upcomingConfirmed.map((row) => row.id)).toEqual(['app-hired']);
  });
});

describe('getWorkerOpenListExcludedShiftIds', () => {
  it('excludes pending and confirmed cover requests from Open browse', () => {
    const excluded = getWorkerOpenListExcludedShiftIds([
      makeApplication({
        id: 'app-applied',
        status: 'applied',
        shift_date: '2099-01-15',
        shift_post_id: 'shift-applied',
      }),
      makeApplication({
        id: 'app-hired',
        status: 'hired',
        shift_date: '2099-01-16',
        shift_post_id: 'shift-hired',
      }),
      makeApplication({
        id: 'app-declined',
        status: 'rejected',
        shift_date: '2099-01-17',
        shift_post_id: 'shift-declined',
      }),
    ]);

    expect([...excluded].sort()).toEqual(['shift-applied', 'shift-hired']);
  });
});

describe('isFillInsTabMode', () => {
  it('accepts pending along with existing tabs', () => {
    expect(isFillInsTabMode('pending')).toBe(true);
    expect(isFillInsTabMode('confirmed')).toBe(true);
    expect(isFillInsTabMode('availability')).toBe(false);
  });
});

describe('resolveWorkerFillInsTabMode', () => {
  it('maps hired upcoming applications to confirmed', () => {
    expect(
      resolveWorkerFillInsTabMode({
        status: 'hired',
        shift_date: '2099-01-15',
        status_closed_by: null,
      }),
    ).toBe('confirmed');
  });

  it('maps pending cover requests to pending', () => {
    expect(
      resolveWorkerFillInsTabMode({
        status: 'applied',
        shift_date: '2099-01-15',
        status_closed_by: null,
      }),
    ).toBe('pending');
  });
});
