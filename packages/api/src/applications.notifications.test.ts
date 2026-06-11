import { describe, expect, it } from 'vitest';

import {
  APPLICATION_UPDATE_GRACE_MS,
  hasWorkerApplicationClinicUpdate,
  isClinicApplicationUnseen,
  isClinicNewApplication,
  isClinicNewFillInRequest,
  isWorkerApplicationUpdateHighlighted,
  isWorkerApplicationUpdateUnseen,
} from './applicationNotificationPredicates';

const baseCreatedAt = '2026-01-01T12:00:00.000Z';

function attentionAt(offsetMs: number): string {
  return new Date(new Date(baseCreatedAt).getTime() + offsetMs).toISOString();
}

describe('hasWorkerApplicationClinicUpdate', () => {
  it('ignores initial apply within grace window', () => {
    expect(
      hasWorkerApplicationClinicUpdate({
        created_at: baseCreatedAt,
        worker_hidden_at: null,
        worker_attention_at: attentionAt(APPLICATION_UPDATE_GRACE_MS - 1),
      }),
    ).toBe(false);
  });

  it('detects clinic activity after grace window', () => {
    expect(
      hasWorkerApplicationClinicUpdate({
        created_at: baseCreatedAt,
        worker_hidden_at: null,
        worker_attention_at: attentionAt(APPLICATION_UPDATE_GRACE_MS),
      }),
    ).toBe(true);
  });
});

describe('isWorkerApplicationUpdateUnseen', () => {
  it('returns false when worker has seen latest clinic activity', () => {
    const clinicActivity = attentionAt(10_000);
    expect(
      isWorkerApplicationUpdateUnseen({
        created_at: baseCreatedAt,
        worker_hidden_at: null,
        worker_attention_at: clinicActivity,
        worker_last_seen_at: clinicActivity,
      }),
    ).toBe(false);
  });

  it('returns true when clinic activity is newer than last seen', () => {
    expect(
      isWorkerApplicationUpdateUnseen({
        created_at: baseCreatedAt,
        worker_hidden_at: null,
        worker_attention_at: attentionAt(20_000),
        worker_last_seen_at: attentionAt(10_000),
      }),
    ).toBe(true);
  });
});

describe('isWorkerApplicationUpdateHighlighted', () => {
  it('requires a prior seen baseline before highlighting', () => {
    expect(
      isWorkerApplicationUpdateHighlighted({
        created_at: baseCreatedAt,
        worker_hidden_at: null,
        worker_attention_at: attentionAt(20_000),
        worker_last_seen_at: null,
      }),
    ).toBe(false);
  });
});

describe('isClinicApplicationUnseen', () => {
  it('treats never-seen applications as unseen', () => {
    expect(
      isClinicApplicationUnseen({
        clinic_hidden_at: null,
        clinic_attention_at: baseCreatedAt,
        clinic_last_seen_at: null,
      }),
    ).toBe(true);
  });

  it('returns false after clinic has seen latest worker activity', () => {
    const workerActivity = attentionAt(5_000);
    expect(
      isClinicApplicationUnseen({
        clinic_hidden_at: null,
        clinic_attention_at: workerActivity,
        clinic_last_seen_at: workerActivity,
      }),
    ).toBe(false);
  });
});

describe('isClinicNewApplication', () => {
  it('requires eligible status and unseen attention', () => {
    expect(
      isClinicNewApplication({
        post_type: 'job',
        status: 'applied',
        clinic_hidden_at: null,
        clinic_attention_at: baseCreatedAt,
        clinic_last_seen_at: null,
      }),
    ).toBe(true);

    expect(
      isClinicNewApplication({
        post_type: 'job',
        status: 'reviewed',
        clinic_hidden_at: null,
        clinic_attention_at: baseCreatedAt,
        clinic_last_seen_at: null,
      }),
    ).toBe(false);
  });
});

describe('isClinicNewFillInRequest', () => {
  it('requires pending fill-in status and unseen attention', () => {
    expect(
      isClinicNewFillInRequest({
        post_type: 'shift',
        status: 'applied',
        clinic_hidden_at: null,
        clinic_attention_at: attentionAt(10_000),
        clinic_last_seen_at: attentionAt(1_000),
      }),
    ).toBe(true);

    expect(
      isClinicNewFillInRequest({
        post_type: 'shift',
        status: 'applied',
        clinic_hidden_at: null,
        clinic_attention_at: attentionAt(1_000),
        clinic_last_seen_at: attentionAt(5_000),
      }),
    ).toBe(false);
  });
});
