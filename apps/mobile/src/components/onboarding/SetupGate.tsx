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
  getClinicSetupGateDecision,
  getWorkerSetupGateDecision,
} from '@/lib/setupGateDecision';
import { isClinicGroupsEnabled } from '@chairside/api';

function renderGateDecision(
  decision: ReturnType<typeof getClinicSetupGateDecision>,
  children: ReactNode,
) {
  if (decision.type === 'loading') return <PageLoadingSpinner />;
  if (decision.type === 'redirect') return <Redirect href={decision.href} />;
  return children;
}

export function ClinicSetupGate({ children }: { children: ReactNode }) {
  const { session, isAuthReady, profile } = useAuth();
  const { clinicProfile, isClinicProfileReady, membership, isOwner } = useClinicProfile();

  const decision = getClinicSetupGateDecision({
    isAuthReady,
    session,
    profile,
    isClinicProfileReady,
    clinicProfile,
    membership,
    isOwner,
    isClinicGroupsEnabled: isClinicGroupsEnabled(),
    isClinicSetupComplete,
  });

  return renderGateDecision(decision, children);
}

export function WorkerSetupGate({ children }: { children: ReactNode }) {
  const { session, isAuthReady, profile } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();

  const decision = getWorkerSetupGateDecision({
    isAuthReady,
    session,
    profile,
    isWorkerProfileReady,
    workerProfile,
    isWorkerSetupComplete,
  });

  return renderGateDecision(decision, children);
}
