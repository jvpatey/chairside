import { describe, expect, it } from 'vitest';

import {
  getWorkerProfileFormMissing,
  getWorkerProfileIncompleteBanner,
  listWorkerProfileFormMissingLabels,
} from './workerProfileFormMissing';

describe('getWorkerProfileFormMissing', () => {
  it('flags empty required fields', () => {
    expect(
      getWorkerProfileFormMissing({
        firstName: '',
        lastName: 'Lee',
        phone: '',
        roleTypes: [],
        city: '',
        province: 'NS',
      }),
    ).toEqual({
      firstName: true,
      lastName: false,
      phone: true,
      roles: true,
      city: true,
      province: false,
    });
  });
});

describe('getWorkerProfileIncompleteBanner', () => {
  it('leads with SMS copy when phone is missing', () => {
    const missing = getWorkerProfileFormMissing({
      firstName: 'Ada',
      lastName: 'Lee',
      phone: '',
      roleTypes: ['hygienist'],
      city: 'Halifax',
      province: 'NS',
    });
    expect(getWorkerProfileIncompleteBanner(missing)).toEqual({
      title: 'Add a mobile number for text alerts',
      body: 'Fill-in openings are sent by SMS — add your phone so you don’t miss same-day cover.',
    });
  });

  it('lists other gaps when phone is present', () => {
    const missing = getWorkerProfileFormMissing({
      firstName: 'Ada',
      lastName: 'Lee',
      phone: '9025550100',
      roleTypes: [],
      city: '',
      province: 'NS',
    });
    expect(listWorkerProfileFormMissingLabels(missing)).toEqual(['role', 'city']);
    expect(getWorkerProfileIncompleteBanner(missing)?.title).toBe('Finish your profile');
  });

  it('returns null when nothing is missing', () => {
    const missing = getWorkerProfileFormMissing({
      firstName: 'Ada',
      lastName: 'Lee',
      phone: '9025550100',
      roleTypes: ['hygienist'],
      city: 'Halifax',
      province: 'NS',
    });
    expect(getWorkerProfileIncompleteBanner(missing)).toBeNull();
  });
});
