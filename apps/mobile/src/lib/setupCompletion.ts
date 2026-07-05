import {
  isClinicProfileComplete,
  isWorkerProfileComplete,
  type ClinicProfile,
  type WorkerProfile,
} from '@chairside/api';

export function isClinicSetupComplete(profile: ClinicProfile | null): boolean {
  if (!profile) return false;
  if (profile.setup_completed_at) return true;
  return isClinicProfileComplete(profile);
}

export function isWorkerSetupComplete(profile: WorkerProfile | null): boolean {
  if (!profile) return false;
  if (profile.setup_completed_at) return true;
  return isWorkerProfileComplete(profile);
}
