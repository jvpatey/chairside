import {
  isClinicProfileComplete,
  isWorkerProfileComplete,
  type ClinicProfile,
  type WorkerProfile,
} from '@chairside/api';

export function isClinicSetupComplete(profile: ClinicProfile | null): boolean {
  return Boolean(profile?.setup_completed_at) && isClinicProfileComplete(profile);
}

export function isWorkerSetupComplete(profile: WorkerProfile | null): boolean {
  return Boolean(profile?.setup_completed_at) && isWorkerProfileComplete(profile);
}
