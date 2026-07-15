import type { Href } from 'expo-router';

import {
  CLINIC_SETUP_ABOUT,
  CLINIC_SETUP_ACCOUNT_TYPE,
  CLINIC_SETUP_BASICS,
  CLINIC_SETUP_LOCATION,
  CLINIC_SETUP_LOCATIONS,
  CLINIC_SETUP_PRACTICE,
  CLINIC_SETUP_REVIEW,
  CLINIC_SETUP_TEAM,
} from '@/lib/routing';

export type ClinicSetupNavStep = {
  id: string;
  label: string;
  href: Href;
};

/** Individual clinic setup when account-type is enabled. */
export const CLINIC_INDIVIDUAL_SETUP_STEPS: ClinicSetupNavStep[] = [
  { id: 'account-type', label: 'Account type', href: CLINIC_SETUP_ACCOUNT_TYPE },
  { id: 'basics', label: 'Basics', href: CLINIC_SETUP_BASICS },
  { id: 'location', label: 'Location', href: CLINIC_SETUP_LOCATION },
  { id: 'practice', label: 'Practice', href: CLINIC_SETUP_PRACTICE },
  { id: 'about', label: 'About', href: CLINIC_SETUP_ABOUT },
  { id: 'review', label: 'Review', href: CLINIC_SETUP_REVIEW },
];

/** Group clinic setup when account-type is enabled. */
export const CLINIC_GROUP_SETUP_STEPS: ClinicSetupNavStep[] = [
  { id: 'account-type', label: 'Account type', href: CLINIC_SETUP_ACCOUNT_TYPE },
  { id: 'basics', label: 'Basics', href: CLINIC_SETUP_BASICS },
  { id: 'locations', label: 'Locations', href: CLINIC_SETUP_LOCATIONS },
  { id: 'team', label: 'Team', href: CLINIC_SETUP_TEAM },
  { id: 'about', label: 'About', href: CLINIC_SETUP_ABOUT },
  { id: 'review', label: 'Review', href: CLINIC_SETUP_REVIEW },
];

export function getClinicSetupSteps(isGroup: boolean): ClinicSetupNavStep[] {
  return isGroup ? CLINIC_GROUP_SETUP_STEPS : CLINIC_INDIVIDUAL_SETUP_STEPS;
}

export function getClinicSetupStepNumber(
  stepId: ClinicSetupNavStep['id'],
  isGroup: boolean,
): { step: number; total: number } {
  const steps = getClinicSetupSteps(isGroup);
  const index = steps.findIndex((step) => step.id === stepId);
  return {
    step: index >= 0 ? index + 1 : 1,
    total: steps.length,
  };
}

/** Resolve the active setup step from a router pathname. */
export function getClinicSetupStepIndexFromPath(pathname: string, isGroup: boolean): number {
  const steps = getClinicSetupSteps(isGroup);
  // Prefer longer ids first so "locations" does not match "location".
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
