import { describe, expect, it, vi } from 'vitest';

vi.mock('@chairside/api', () => ({
  getWorkerRoleTypes: () => [],
}));

import { validateWorkerBasicsStep, getClinicSetupStepGuard } from './setupStepValidation';

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

describe('getClinicSetupStepGuard', () => {
  it('does not bounce group review to locations based on org profile address', () => {
    const group = {
      account_type: 'group' as const,
      clinic_name: 'Harbour Group',
      contact_name: 'Dr. Lee',
      phone: '9025550100',
      address_line1: '',
      city: '',
      postal_code: '',
      software_used: [],
    };

    expect(getClinicSetupStepGuard(group as never, 'review')).toBeNull();
    expect(getClinicSetupStepGuard(group as never, 'about')).toBeNull();
    expect(getClinicSetupStepGuard(group as never, 'practice')).toEqual('/(clinic-setup)/about');
  });
});
