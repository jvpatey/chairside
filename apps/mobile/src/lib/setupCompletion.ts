import {
  isClinicProfileComplete,
  isWorkerProfileComplete,
  type ClinicProfile,
  type ClinicProfileCompletenessOptions,
  type WorkerProfile,
} from '@chairside/api';

type WorkerSetupProfile = Pick<
  WorkerProfile,
  'setup_completed_at' | 'role_type' | 'role_types' | 'address_line1' | 'city' | 'postal_code'
>;

export function isClinicSetupComplete(
  profile: ClinicProfile | null,
  options?: ClinicProfileCompletenessOptions,
): boolean {
  if (!profile) return false;
  if (profile.setup_completed_at) return true;
  return isClinicProfileComplete(profile, options);
}

export function isWorkerSetupComplete(profile: WorkerSetupProfile | null): boolean {
  if (!profile) return false;
  if (profile.setup_completed_at) return true;
  return isWorkerProfileComplete(profile);
}
