import type { ClinicProfile, WorkerProfile } from '@chairside/api';
import { router } from 'expo-router';
import { useEffect } from 'react';

import {
  getClinicSetupStepGuard,
  getWorkerSetupStepGuard,
  type ClinicSetupStepId,
  type WorkerSetupStepId,
} from '@/lib/setupStepValidation';

export function useClinicSetupStepGuard(
  step: ClinicSetupStepId,
  profile: ClinicProfile | null,
  isReady: boolean,
  isEditMode: boolean,
) {
  useEffect(() => {
    if (isEditMode || !isReady) return;

    const redirectHref = getClinicSetupStepGuard(profile, step);
    if (redirectHref) {
      router.replace(redirectHref);
    }
  }, [isEditMode, isReady, profile, step]);
}

export function useWorkerSetupStepGuard(
  step: WorkerSetupStepId,
  profile: WorkerProfile | null,
  displayName: string | null | undefined,
  isReady: boolean,
  isEditMode: boolean,
) {
  useEffect(() => {
    if (isEditMode || !isReady) return;

    const redirectHref = getWorkerSetupStepGuard(profile, displayName, step);
    if (redirectHref) {
      router.replace(redirectHref);
    }
  }, [displayName, isEditMode, isReady, profile, step]);
}
