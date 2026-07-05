import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { PageLoadingSpinner } from '@/components/ui/PageLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import {
  isClinicSetupComplete,
  isWorkerSetupComplete,
} from '@/lib/setupCompletion';
import { CLINIC_SETUP_BASICS, WORKER_SETUP_BASICS } from '@/lib/routing';

export function ClinicSetupGate({ children }: { children: ReactNode }) {
  const { session, isAuthReady } = useAuth();
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();

  if (!isAuthReady || !session) {
    return <PageLoadingSpinner />;
  }

  if (!isClinicProfileReady) {
    return <PageLoadingSpinner />;
  }

  if (!isClinicSetupComplete(clinicProfile)) {
    return <Redirect href={CLINIC_SETUP_BASICS} />;
  }

  return children;
}

export function WorkerSetupGate({ children }: { children: ReactNode }) {
  const { session, isAuthReady } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();

  if (!isAuthReady || !session) {
    return <PageLoadingSpinner />;
  }

  if (!isWorkerProfileReady) {
    return <PageLoadingSpinner />;
  }

  if (!isWorkerSetupComplete(workerProfile)) {
    return <Redirect href={WORKER_SETUP_BASICS} />;
  }

  return children;
}
