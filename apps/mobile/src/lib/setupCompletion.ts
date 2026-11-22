import {
  isClinicProfileComplete,
  isWorkerProfileComplete,
  type ClinicProfile,
  type ClinicProfileCompletenessOptions,
  type Profile,
  type WorkerProfile,
} from '@chairside/api';

type WorkerSetupProfile = Pick<
  WorkerProfile,
  'setup_completed_at' | 'role_type' | 'role_types' | 'phone' | 'city' | 'province'
>;

export function isClinicSetupComplete(
  profile: ClinicProfile | null,
  options?: ClinicProfileCompletenessOptions,
): boolean {
  if (!profile) return false;
  if (profile.setup_completed_at) return true;
  return isClinicProfileComplete(profile, options);
}

/** Ready to apply / fill-in SMS quality — not required to enter worker tabs. */
export function isWorkerSetupComplete(profile: WorkerSetupProfile | null): boolean {
  if (!profile) return false;
  if (profile.setup_completed_at) return true;
  return isWorkerProfileComplete(profile);
}

/** Workers may use the app immediately after choosing the worker role. */
export function canAccessWorkerTabs(profile: Pick<Profile, 'role'> | null | undefined): boolean {
  return profile?.role === 'worker';
}
