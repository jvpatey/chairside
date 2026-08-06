import { Platform } from 'react-native';

import { useSetupEditMode } from '@/hooks/useSetupEditMode';

/** FormScreen props for setup wizards — web rail shell vs native full-screen atmosphere. */
export function useSetupFormScreenProps(role: 'worker' | 'clinic') {
  const { isEditMode } = useSetupEditMode({ role });
  const isWeb = Platform.OS === 'web';
  const passThroughShell = isWeb && !isEditMode;

  return {
    atmosphere: 'none' as const,
    transparentBackground: passThroughShell,
    constrainFormWidth: isWeb,
  };
}
