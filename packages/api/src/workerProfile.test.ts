import { describe, expect, it } from 'vitest';

import {
  getMissingWorkerProfileFields,
  getWorkerRoleTypes,
  isWorkerProfileComplete,
} from './workerProfileValidation';

function buildProfile(partial: {
  role_type?: string | null;
  role_types?: string[];
  phone?: string | null;
  city?: string | null;
  province?: string | null;
}) {
  return {
    role_type: null,
    role_types: [],
    phone: '9025551234',
    city: 'Halifax',
    province: 'NS',
    ...partial,
  };
}

describe('getWorkerRoleTypes', () => {
  it('returns role_types when populated', () => {
    expect(
      getWorkerRoleTypes(
        buildProfile({ role_types: ['assistant', 'hygienist'], role_type: 'dentist' }),
      ),
    ).toEqual(['assistant', 'hygienist']);
  });

  it('falls back to legacy role_type', () => {
    expect(getWorkerRoleTypes(buildProfile({ role_type: 'hygienist' }))).toEqual(['hygienist']);
  });
});

describe('isWorkerProfileComplete', () => {
  it('accepts profiles with multiple roles', () => {
    expect(
      isWorkerProfileComplete(
        buildProfile({ role_types: ['assistant', 'hygienist'], role_type: 'assistant' }),
      ),
    ).toBe(true);
  });

  it('requires at least one role', () => {
    expect(isWorkerProfileComplete(buildProfile({ role_types: [], role_type: null }))).toBe(false);
    expect(getMissingWorkerProfileFields(buildProfile({ role_types: [], role_type: null }))).toContain(
      'Role type',
    );
  });

  it('requires a mobile phone', () => {
    expect(isWorkerProfileComplete(buildProfile({ phone: '' }))).toBe(false);
    expect(getMissingWorkerProfileFields(buildProfile({ phone: null }))).toContain('Mobile phone');
  });

  it('requires city and province, not street address', () => {
    expect(isWorkerProfileComplete(buildProfile({ city: '', province: 'NS' }))).toBe(false);
    expect(getMissingWorkerProfileFields(buildProfile({ city: null }))).toContain('City');
    expect(isWorkerProfileComplete(buildProfile({ role_types: ['hygienist'] }))).toBe(true);
  });
});
