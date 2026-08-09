import type { Href } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import {
  CLINIC_PROFILE,
  CLINIC_PROFILE_ABOUT,
  CLINIC_PROFILE_PRACTICE,
  getApplyRoute,
  WORKER_PROFILE,
  WORKER_PROFILE_APPLICATION_KIT,
  WORKER_PROFILE_PROFESSIONAL,
  type ApplyPostType,
} from '@/lib/routing';

export type SetupReturnTarget =
  | 'worker-profile'
  | 'worker-professional'
  | 'worker-application-kit'
  | 'worker-apply'
  | 'clinic-profile'
  | 'clinic-practice'
  | 'clinic-about';

const SETUP_RETURN_ROUTES: Record<Exclude<SetupReturnTarget, 'worker-apply'>, Href> = {
  'worker-profile': WORKER_PROFILE,
  'worker-professional': WORKER_PROFILE_PROFESSIONAL,
  'worker-application-kit': WORKER_PROFILE_APPLICATION_KIT,
  'clinic-profile': CLINIC_PROFILE,
  'clinic-practice': CLINIC_PROFILE_PRACTICE,
  'clinic-about': CLINIC_PROFILE_ABOUT,
};

const SETUP_RETURN_TARGETS = new Set<string>([
  ...Object.keys(SETUP_RETURN_ROUTES),
  'worker-apply',
]);

export function isSetupReturnTarget(value: unknown): value is SetupReturnTarget {
  return typeof value === 'string' && SETUP_RETURN_TARGETS.has(value);
}

/** Build a setup route that exits back to a profile section after saving. */
export function getSetupEditRoute(
  pathname: string,
  returnTo: SetupReturnTarget,
  extraParams?: Record<string, string>,
): Href {
  return { pathname, params: { returnTo, ...extraParams } } as Href;
}

export function getApplyApplicationKitEditRoute(postType: ApplyPostType, postId: string): Href {
  return getSetupEditRoute('/(worker-setup)/application-kit', 'worker-apply', {
    postType,
    postId,
  });
}

export function getSetupEditBackLabel(
  returnTo?: SetupReturnTarget,
  postType?: ApplyPostType,
): string | undefined {
  if (returnTo === 'worker-apply') {
    return postType === 'shift' ? 'Back to cover request' : 'Back to apply';
  }
  return undefined;
}

type UseSetupEditModeOptions = {
  role?: 'worker' | 'clinic';
};

export function useSetupEditMode(options?: UseSetupEditModeOptions) {
  const { returnTo: returnToParam, postType, postId } = useLocalSearchParams<{
    returnTo?: string;
    postType?: string;
    postId?: string;
  }>();
  const { workerProfile } = useWorkerProfile();
  const { clinicProfile } = useClinicProfile();

  const returnTo = isSetupReturnTarget(returnToParam) ? returnToParam : undefined;
  const applyPostType =
    postType === 'job' || postType === 'shift' ? (postType as ApplyPostType) : undefined;
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
  const exitHref =
    returnTo === 'worker-apply' && applyPostType && typeof postId === 'string'
      ? getApplyRoute(applyPostType, postId)
      : returnTo && returnTo !== 'worker-apply'
        ? SETUP_RETURN_ROUTES[returnTo]
        : defaultExit;

  return {
    isEditMode,
    returnTo,
    exitHref,
    applyPostType: returnTo === 'worker-apply' ? applyPostType : undefined,
  };
}
