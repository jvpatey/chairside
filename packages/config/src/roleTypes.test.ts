import { describe, expect, it } from 'vitest';

import {
  formatRoleTypesLabel,
  resolveWorkerRoleTypes,
  workerMatchesPostRole,
} from './clinicOptions';

describe('resolveWorkerRoleTypes', () => {
  it('prefers role_types when present', () => {
    expect(
      resolveWorkerRoleTypes({
        role_types: ['assistant', 'hygienist'],
        role_type: 'dentist',
      }),
    ).toEqual(['assistant', 'hygienist']);
  });

  it('falls back to legacy role_type', () => {
    expect(resolveWorkerRoleTypes({ role_type: 'hygienist' })).toEqual(['hygienist']);
  });

  it('returns empty when no roles are stored', () => {
    expect(resolveWorkerRoleTypes({})).toEqual([]);
  });
});

describe('formatRoleTypesLabel', () => {
  it('joins multiple role labels', () => {
    expect(formatRoleTypesLabel(['hygienist', 'assistant'])).toBe(
      'Dental Hygienist · Dental Assistant',
    );
  });
});

describe('workerMatchesPostRole', () => {
  it('matches when any stored role overlaps the post role', () => {
    expect(
      workerMatchesPostRole({ role_types: ['assistant', 'hygienist'] }, 'hygienist'),
    ).toBe(true);
  });

  it('does not match unrelated post roles', () => {
    expect(workerMatchesPostRole({ role_types: ['assistant'] }, 'dentist')).toBe(false);
  });
});
