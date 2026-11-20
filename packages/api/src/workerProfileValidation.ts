import { resolveWorkerRoleTypes, type RoleType } from '@chairside/config';

import type { WorkerProfileRow } from './types';

export type WorkerProfileRoleFields = Pick<WorkerProfileRow, 'role_type' | 'role_types'>;

export function getWorkerRoleTypes(
  profile: WorkerProfileRoleFields | null | undefined,
): RoleType[] {
  if (!profile) return [];
  return resolveWorkerRoleTypes(profile);
}

export function isWorkerProfileComplete(
  profile: Pick<
    WorkerProfileRow,
    'role_type' | 'role_types' | 'phone' | 'address_line1' | 'city' | 'postal_code'
  > | null,
): boolean {
  if (!profile) return false;

  return (
    getWorkerRoleTypes(profile).length > 0 &&
    Boolean(profile.phone?.trim()) &&
    Boolean(profile.address_line1?.trim()) &&
    Boolean(profile.city?.trim()) &&
    Boolean(profile.postal_code?.trim())
  );
}

export function getMissingWorkerProfileFields(
  profile: Pick<
    WorkerProfileRow,
    'role_type' | 'role_types' | 'phone' | 'address_line1' | 'city' | 'postal_code'
  > | null,
): string[] {
  if (!profile) {
    return ['Role type', 'Mobile phone', 'Street address', 'City', 'Postal code'];
  }

  const missing: string[] = [];
  if (getWorkerRoleTypes(profile).length === 0) missing.push('Role type');
  if (!profile.phone?.trim()) missing.push('Mobile phone');
  if (!profile.address_line1?.trim()) missing.push('Street address');
  if (!profile.city?.trim()) missing.push('City');
  if (!profile.postal_code?.trim()) missing.push('Postal code');
  return missing;
}
