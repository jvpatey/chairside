import type { Href } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import {
  CLINIC_PROFILE,
  CLINIC_PROFILE_ABOUT,
  CLINIC_PROFILE_PRACTICE,
  WORKER_PROFILE,
  WORKER_PROFILE_APPLICATION_KIT,
  WORKER_PROFILE_PROFESSIONAL,
} from '@/lib/routing';

export type SetupReturnTarget =
  | 'worker-profile'
  | 'worker-professional'
  | 'worker-application-kit'
  | 'clinic-profile'
  | 'clinic-practice'
  | 'clinic-about';

const SETUP_RETURN_ROUTES: Record<SetupReturnTarget, Href> = {
  'worker-profile': WORKER_PROFILE,
  'worker-professional': WORKER_PROFILE_PROFESSIONAL,
  'worker-application-kit': WORKER_PROFILE_APPLICATION_KIT,
  'clinic-profile': CLINIC_PROFILE,
  'clinic-practice': CLINIC_PROFILE_PRACTICE,
  'clinic-about': CLINIC_PROFILE_ABOUT,
};

export function isSetupReturnTarget(value: unknown): value is SetupReturnTarget {
  return typeof value === 'string' && value in SETUP_RETURN_ROUTES;
}

/** Build a setup route that exits back to a profile section after saving. */
export function getSetupEditRoute(pathname: string, returnTo: SetupReturnTarget): Href {
  return { pathname, params: { returnTo } } as Href;
}

type UseSetupEditModeOptions = {
  role?: 'worker' | 'clinic';
};

export function useSetupEditMode(options?: UseSetupEditModeOptions) {
  const { returnTo: returnToParam } = useLocalSearchParams<{ returnTo?: string }>();
  const { workerProfile } = useWorkerProfile();
  const { clinicProfile } = useClinicProfile();

  const returnTo = isSetupReturnTarget(returnToParam) ? returnToParam : undefined;
  const setupComplete =
    options?.role === 'clinic'
      ? Boolean(clinicProfile?.setup_completed_at)
      : options?.role === 'worker'
        ? Boolean(workerProfile?.setup_completed_at)
        : Boolean(workerProfile?.setup_completed_at ?? clinicProfile?.setup_completed_at);
  const isEditMode = Boolean(returnTo) || setupComplete;
  const defaultExit =
    options?.role === 'clinic' || returnTo?.startsWith('clinic-')
      ? CLINIC_PROFILE
      : WORKER_PROFILE;
  const exitHref = returnTo ? SETUP_RETURN_ROUTES[returnTo] : defaultExit;

  return {
    isEditMode,
    returnTo,
    exitHref,
  };
}
