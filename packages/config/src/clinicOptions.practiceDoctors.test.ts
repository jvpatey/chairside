import { describe, expect, it } from 'vitest';

import {
  createPracticeDoctor,
  normalizePracticeDoctor,
  normalizePracticeDoctors,
} from './clinicOptions';

describe('PracticeDoctor location_ids', () => {
  it('defaults missing location_ids to an empty array on create', () => {
    const doctor = createPracticeDoctor({ name: 'Dr. Jane Smith' });
    expect(doctor.location_ids).toEqual([]);
  });

  it('preserves location_ids on create', () => {
    const doctor = createPracticeDoctor({
      name: 'Dr. Jane Smith',
      location_ids: ['loc-1', 'loc-2', 'loc-1', '  '],
    });
    expect(doctor.location_ids).toEqual(['loc-1', 'loc-2']);
  });

  it('preserves location_ids on normalize and defaults when missing', () => {
    expect(
      normalizePracticeDoctor({
        id: 'd1',
        name: 'Dr. Ada',
        location_ids: ['a', 'b'],
      }),
    ).toMatchObject({
      id: 'd1',
      name: 'Dr. Ada',
      location_ids: ['a', 'b'],
    });

    expect(
      normalizePracticeDoctor({
        id: 'd2',
        name: 'Dr. Legacy',
      }),
    ).toMatchObject({
      id: 'd2',
      name: 'Dr. Legacy',
      location_ids: [],
    });
  });

  it('normalizes arrays of doctors with mixed location_ids', () => {
    const doctors = normalizePracticeDoctors([
      { name: 'One', location_ids: ['loc-1'] },
      { name: 'Two' },
      null,
    ]);
    expect(doctors.map((d) => d.location_ids)).toEqual([['loc-1'], []]);
  });
});
