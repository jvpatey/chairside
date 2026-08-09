import { isClinicGroupsEnabled } from '@chairside/api';
import type { Href } from 'expo-router';

import {
  CLINIC_SETUP_ABOUT,
  CLINIC_SETUP_BASICS,
  CLINIC_SETUP_LOCATION,
  CLINIC_SETUP_PRACTICE,
  CLINIC_SETUP_REVIEW,
  getClinicSetupStepIndexFromPath,
  getClinicSetupStepNumber,
  getClinicSetupSteps,
  type ClinicSetupNavStep,
} from '@/lib/clinicSetupSteps';

export type SetupRole = 'worker' | 'clinic';

export type SetupNavStep = {
  id: string;
  label: string;
  href: Href;
};

export const WORKER_SETUP_STEPS: SetupNavStep[] = [
  { id: 'basics', label: 'Basics', href: '/(worker-setup)/basics' },
  { id: 'experience', label: 'Experience', href: '/(worker-setup)/experience' },
  { id: 'skills', label: 'Skills', href: '/(worker-setup)/skills' },
  { id: 'location', label: 'Location', href: '/(worker-setup)/location' },
  { id: 'review', label: 'Review', href: '/(worker-setup)/review' },
];

export const CLINIC_SETUP_STEPS_LEGACY: SetupNavStep[] = [
  { id: 'basics', label: 'Basics', href: CLINIC_SETUP_BASICS },
  { id: 'location', label: 'Location', href: CLINIC_SETUP_LOCATION },
  { id: 'practice', label: 'Practice', href: CLINIC_SETUP_PRACTICE },
  { id: 'about', label: 'About', href: CLINIC_SETUP_ABOUT },
  { id: 'review', label: 'Review', href: CLINIC_SETUP_REVIEW },
];

export type WorkerSetupStepId = (typeof WORKER_SETUP_STEPS)[number]['id'];
export type ClinicSetupStepId =
  | (typeof CLINIC_SETUP_STEPS_LEGACY)[number]['id']
  | ClinicSetupNavStep['id'];

function getWorkerActiveStepIndex(pathname: string): number {
  const ordered = [...WORKER_SETUP_STEPS].sort((a, b) => b.id.length - a.id.length);
  const match = ordered.find(
    (step) => pathname.includes(`/${step.id}`) || pathname.endsWith(step.id),
  );
  if (!match) return 0;
  return Math.max(
    0,
    WORKER_SETUP_STEPS.findIndex((step) => step.id === match.id),
  );
}

export function getSetupSteps(role: SetupRole, isGroup: boolean): SetupNavStep[] {
  if (role === 'worker') return WORKER_SETUP_STEPS;
  if (!isClinicGroupsEnabled()) return CLINIC_SETUP_STEPS_LEGACY;
  return getClinicSetupSteps(isGroup).map((step) => ({
    id: step.id,
    label: step.label,
    href: step.href,
  }));
}

export function getSetupStepIndexFromPath(
  role: SetupRole,
  pathname: string,
  isGroup: boolean,
): number {
  if (role === 'clinic' && isClinicGroupsEnabled()) {
    return getClinicSetupStepIndexFromPath(pathname, isGroup);
  }
  if (role === 'clinic') {
    const ordered = [...CLINIC_SETUP_STEPS_LEGACY].sort((a, b) => b.id.length - a.id.length);
    const match = ordered.find(
      (step) => pathname.includes(`/${step.id}`) || pathname.endsWith(step.id),
    );
    if (!match) return 0;
    return Math.max(
      0,
      CLINIC_SETUP_STEPS_LEGACY.findIndex((step) => step.id === match.id),
    );
  }
  return getWorkerActiveStepIndex(pathname);
}

export function getSetupStepCount(role: SetupRole, isGroup: boolean): number {
  return getSetupSteps(role, isGroup).length;
}

export function getSetupStepNumber(
  role: SetupRole,
  stepId: string,
  isGroup: boolean,
): { step: number; total: number } {
  if (role === 'clinic' && isClinicGroupsEnabled()) {
    return getClinicSetupStepNumber(stepId as ClinicSetupNavStep['id'], isGroup);
  }

  const steps = getSetupSteps(role, isGroup);
  const index = steps.findIndex((step) => step.id === stepId);
  return {
    step: index >= 0 ? index + 1 : 1,
    total: steps.length,
  };
}
