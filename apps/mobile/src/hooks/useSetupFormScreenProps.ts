import { Platform } from 'react-native';

import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { FORM_CONTENT_MAX_WIDTH } from '@/theme/formFieldTokens';

/** FormScreen props for setup wizards — web rail shell vs native full-screen atmosphere. */
export function useSetupFormScreenProps(role: 'worker' | 'clinic') {
  const { isEditMode } = useSetupEditMode({ role });
  const { contentMaxWidth, isTablet } = useResponsiveLayout();
  const isWeb = Platform.OS === 'web';
  const passThroughShell = isWeb && !isEditMode;
  const useWideEditLayout = isEditMode && (isWeb || isTablet);

  return {
    atmosphere: 'none' as const,
    transparentBackground: passThroughShell,
    // Sidebar wizard: card + footer span the content column. Edit mode uses responsive max width.
    constrainFormWidth: useWideEditLayout,
    formMaxWidth: contentMaxWidth ?? FORM_CONTENT_MAX_WIDTH,
    elevatedCard: passThroughShell,
  };
}
