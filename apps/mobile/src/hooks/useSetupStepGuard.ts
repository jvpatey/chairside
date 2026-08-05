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
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  isReady: boolean,
  isEditMode: boolean,
) {
  useEffect(() => {
    if (isEditMode || !isReady) return;

    const redirectHref = getWorkerSetupStepGuard(profile, firstName, lastName, step);
    if (redirectHref) {
      router.replace(redirectHref);
    }
  }, [firstName, isEditMode, isReady, lastName, profile, step]);
}
