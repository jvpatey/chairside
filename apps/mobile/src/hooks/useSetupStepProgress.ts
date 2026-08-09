import { Platform } from 'react-native';

import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { getSetupStepNumber, getSetupSteps, type SetupRole } from '@/lib/setupSteps';

type UseSetupStepProgressOptions = {
  role: SetupRole;
  /** Hide on web when the setup sidebar rail is visible. Defaults to true. */
  hideOnWebRail?: boolean;
  /** Override clinic group mode (e.g. account-type before profile is saved). */
  isGroupOverride?: boolean;
};

export function useSetupStepProgress(
  stepId: string,
  { role, hideOnWebRail = true, isGroupOverride }: UseSetupStepProgressOptions,
) {
  const { isGroup } = useClinicProfile();
  const resolvedIsGroup = isGroupOverride ?? isGroup;
  const { isEditMode } = useSetupEditMode({ role });
  const { step, total } = getSetupStepNumber(role, stepId, resolvedIsGroup);
  const stepIndex = getSetupSteps(role, resolvedIsGroup).findIndex((entry) => entry.id === stepId);
  const inWizard = stepIndex >= 0;
  const visible =
    inWizard && !isEditMode && !(hideOnWebRail && Platform.OS === 'web' && !isEditMode);

  return { step, total, visible };
}
