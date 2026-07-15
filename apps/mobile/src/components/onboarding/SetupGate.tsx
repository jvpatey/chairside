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
import {
  CLINIC_SETUP_ACCOUNT_TYPE,
  CLINIC_SETUP_BASICS,
  WORKER_SETUP_BASICS,
} from '@/lib/routing';
import { isClinicGroupsEnabled } from '@chairside/api';

export function ClinicSetupGate({ children }: { children: ReactNode }) {
  const { session, isAuthReady, profile } = useAuth();
  const { clinicProfile, isClinicProfileReady, membership, isOwner } = useClinicProfile();

  if (!isAuthReady || !session) {
    return <PageLoadingSpinner />;
  }

  if (profile === null) {
    return <PageLoadingSpinner />;
  }

  if (profile.role !== 'clinic') {
    return <PageLoadingSpinner />;
  }

  if (!isClinicProfileReady) {
    return <PageLoadingSpinner />;
  }

  // Invited managers join a completed org and skip owner setup.
  if (membership && !isOwner) {
    return children;
  }

  if (clinicProfile === null) {
    return (
      <Redirect
        href={isClinicGroupsEnabled() ? CLINIC_SETUP_ACCOUNT_TYPE : CLINIC_SETUP_BASICS}
      />
    );
  }

  if (!isClinicSetupComplete(clinicProfile)) {
    return (
      <Redirect
        href={
          isClinicGroupsEnabled() && !clinicProfile.account_type
            ? CLINIC_SETUP_ACCOUNT_TYPE
            : CLINIC_SETUP_BASICS
        }
      />
    );
  }

  return children;
}

export function WorkerSetupGate({ children }: { children: ReactNode }) {
  const { session, isAuthReady, profile } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();

  if (!isAuthReady || !session) {
    return <PageLoadingSpinner />;
  }

  if (profile === null) {
    return <PageLoadingSpinner />;
  }

  if (profile.role !== 'worker') {
    return <PageLoadingSpinner />;
  }

  if (!isWorkerProfileReady || workerProfile === null) {
    return <PageLoadingSpinner />;
  }

  if (!isWorkerSetupComplete(workerProfile)) {
    return <Redirect href={WORKER_SETUP_BASICS} />;
  }

  return children;
}
