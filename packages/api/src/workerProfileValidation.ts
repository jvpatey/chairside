import { resolveWorkerRoleTypes, type RoleType } from '@chairside/config';

import type { WorkerProfileRow } from './types';

export type WorkerProfileRoleFields = Pick<WorkerProfileRow, 'role_type' | 'role_types'>;

export function getWorkerRoleTypes(
  profile: WorkerProfileRoleFields | null | undefined,
): RoleType[] {
  if (!profile) return [];
  return resolveWorkerRoleTypes(profile);
}

/**
 * SMS-first completeness: role + phone + city/province.
 * Street / postal are optional until confirmed cover or directions.
 */
export function isWorkerProfileComplete(
  profile: Pick<
    WorkerProfileRow,
    'role_type' | 'role_types' | 'phone' | 'city' | 'province'
  > | null,
): boolean {
  if (!profile) return false;

  return (
    getWorkerRoleTypes(profile).length > 0 &&
    Boolean(profile.phone?.trim()) &&
    Boolean(profile.city?.trim()) &&
    Boolean(profile.province?.trim())
  );
}

export function getMissingWorkerProfileFields(
  profile: Pick<
    WorkerProfileRow,
    'role_type' | 'role_types' | 'phone' | 'city' | 'province'
  > | null,
): string[] {
  if (!profile) {
    return ['Role type', 'Mobile phone', 'City', 'Province'];
  }

  const missing: string[] = [];
  if (getWorkerRoleTypes(profile).length === 0) missing.push('Role type');
  if (!profile.phone?.trim()) missing.push('Mobile phone');
  if (!profile.city?.trim()) missing.push('City');
  if (!profile.province?.trim()) missing.push('Province');
  return missing;
}
