import { describe, expect, it } from 'vitest';

import {
  getMissingWorkerProfileFields,
  getWorkerRoleTypes,
  isWorkerProfileComplete,
} from './workerProfileValidation';

function buildProfile(partial: {
  role_type?: string | null;
  role_types?: string[];
  address_line1?: string | null;
  city?: string | null;
  postal_code?: string | null;
}) {
  return {
    role_type: null,
    role_types: [],
    address_line1: '123 Main St',
    city: 'Halifax',
    postal_code: 'B3H 1A1',
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
});
