import { describe, expect, it } from 'vitest';

import { normalizeClinicWorkerCrmTags } from '@chairside/config';

import type { ClinicWorkerCrmRecord } from './clinicWorkerCrm';

describe('normalizeClinicWorkerCrmTags', () => {
  it('drops invalid tags before persistence mapping', () => {
    expect(normalizeClinicWorkerCrmTags(['strong_candidate', 'custom_tag'])).toEqual([
      'strong_candidate',
    ]);
  });
});

describe('ClinicWorkerCrmRecord shape', () => {
  it('accepts a minimal record', () => {
    const record: ClinicWorkerCrmRecord = {
      clinic_id: 'clinic-1',
      worker_id: 'worker-1',
      note: 'Strong interview',
      tags: ['strong_candidate'],
      follow_up_at: null,
      created_at: '2026-01-01T12:00:00.000Z',
      updated_at: '2026-01-01T12:00:00.000Z',
    };

    expect(record.tags).toEqual(['strong_candidate']);
  });
});
