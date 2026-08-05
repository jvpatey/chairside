import { describe, expect, it, vi } from 'vitest';

vi.mock('@chairside/api', () => ({
  getWorkerRoleTypes: () => [],
}));

import { validateWorkerBasicsStep } from './setupStepValidation';

describe('validateWorkerBasicsStep', () => {
  it('requires both first and last name', () => {
    expect(
      validateWorkerBasicsStep({
        firstName: '',
        lastName: 'Doe',
        roleTypes: ['hygienist'],
      }),
    ).toEqual({ ok: false, message: 'Enter your first and last name.' });

    expect(
      validateWorkerBasicsStep({
        firstName: 'Jane',
        lastName: '',
        roleTypes: ['hygienist'],
      }),
    ).toEqual({ ok: false, message: 'Enter your first and last name.' });
  });

  it('requires at least one role', () => {
    expect(
      validateWorkerBasicsStep({
        firstName: 'Jane',
        lastName: 'Doe',
        roleTypes: [],
      }),
    ).toEqual({
      ok: false,
      message: 'Select at least one role you are qualified for.',
    });
  });

  it('passes when first, last, and roles are present', () => {
    expect(
      validateWorkerBasicsStep({
        firstName: 'Jane',
        lastName: 'Doe',
        roleTypes: ['hygienist'],
      }),
    ).toEqual({ ok: true, message: null });
  });
});
