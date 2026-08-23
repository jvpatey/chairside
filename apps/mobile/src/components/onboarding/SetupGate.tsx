import { Redirect } from 'expo-router';
import { useRef, type ReactNode } from 'react';

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
  type SetupGateDecision,
} from '@/lib/setupGateDecision';
import { isClinicGroupsEnabled, type WorkerProfile } from '@chairside/api';

function renderGateDecision(
  decision: SetupGateDecision,
  children: ReactNode,
  keepChildrenDuringLoading: boolean,
) {
  if (decision.type === 'loading') {
    // Soft refreshes (browser tab focus / token refresh) must not unmount the
    // tab navigator — remounting resets web tabs to the first declared route.
    if (keepChildrenDuringLoading) return children;
    return <PageLoadingSpinner />;
  }
  if (decision.type === 'redirect') return <Redirect href={decision.href} />;
  return children;
}

export function ClinicSetupGate({ children }: { children: ReactNode }) {
  const { session, isAuthReady, isProfileReady, profile } = useAuth();
  const { clinicProfile, isClinicProfileReady, membership, isOwner, locations } = useClinicProfile();
  const hasShownAppRef = useRef(false);

  const decision = getClinicSetupGateDecision({
    isAuthReady,
    session,
    profile,
    isProfileReady,
    isClinicProfileReady,
    clinicProfile,
    membership,
    isOwner,
    isClinicGroupsEnabled: isClinicGroupsEnabled(),
    isClinicSetupComplete: (nextProfile) =>
      isClinicSetupComplete(nextProfile, { locations }),
  });

  if (decision.type === 'children') {
    hasShownAppRef.current = true;
  }
  if (decision.type === 'redirect' || !session) {
    hasShownAppRef.current = false;
  }

  return renderGateDecision(decision, children, hasShownAppRef.current);
}

export function WorkerSetupGate({ children }: { children: ReactNode }) {
  const { session, isAuthReady, isProfileReady, profile } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const hasShownAppRef = useRef(false);

  const decision = getWorkerSetupGateDecision({
    isAuthReady,
    session,
    profile,
    isProfileReady,
    isWorkerProfileReady,
    workerProfile,
    isWorkerSetupComplete: (profile) => isWorkerSetupComplete(profile as WorkerProfile),
  });

  if (decision.type === 'children') {
    hasShownAppRef.current = true;
  }
  if (decision.type === 'redirect' || !session) {
    hasShownAppRef.current = false;
  }

  return renderGateDecision(decision, children, hasShownAppRef.current);
}
