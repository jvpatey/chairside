import type { Href } from 'expo-router';

import { CLINIC_SETUP_BASICS, CLINIC_SETUP_LOCATION } from '@/lib/routing';

export type ClinicSetupNavStep = {
  id: string;
  label: string;
  href: Href;
};

/**
 * Single thin clinic setup path (no account-type fork, no mandatory review).
 * Multi-clinic sites are added later under Settings → Locations.
 */
export const CLINIC_SETUP_STEPS: ClinicSetupNavStep[] = [
  { id: 'basics', label: 'Basics', href: CLINIC_SETUP_BASICS },
  { id: 'location', label: 'Location', href: CLINIC_SETUP_LOCATION },
];

/** @deprecated Prefer CLINIC_SETUP_STEPS — kept for call sites that still pass isGroup. */
export const CLINIC_INDIVIDUAL_SETUP_STEPS = CLINIC_SETUP_STEPS;

/** @deprecated Prefer CLINIC_SETUP_STEPS — groups no longer have a separate wizard. */
export const CLINIC_GROUP_SETUP_STEPS = CLINIC_SETUP_STEPS;

export function getClinicSetupSteps(_isGroup?: boolean): ClinicSetupNavStep[] {
  return CLINIC_SETUP_STEPS;
}

export function getClinicSetupStepNumber(
  stepId: ClinicSetupNavStep['id'],
  _isGroup?: boolean,
): { step: number; total: number } {
  const steps = CLINIC_SETUP_STEPS;
  const index = steps.findIndex((step) => step.id === stepId);
  return {
    step: index >= 0 ? index + 1 : 1,
    total: steps.length,
  };
}

/** Resolve the active setup step from a router pathname. */
export function getClinicSetupStepIndexFromPath(pathname: string, _isGroup?: boolean): number {
  const steps = CLINIC_SETUP_STEPS;
  const ordered = [...steps].sort((a, b) => b.id.length - a.id.length);
  const match = ordered.find((step) => {
    const pattern = new RegExp(`/(?:\\(.*\\)/)?${step.id}(?:/|$|\\?)`);
    return pattern.test(pathname) || pathname.endsWith(`/${step.id}`) || pathname.includes(`/${step.id}`);
  });
  if (!match) return 0;
  return Math.max(
    0,
    steps.findIndex((step) => step.id === match.id),
  );
}
