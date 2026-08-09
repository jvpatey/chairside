import { Platform } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { FORM_CONTENT_MAX_WIDTH } from '@/theme/formFieldTokens';

/** FormScreen props for clinic posting forms — full-width web card, compact native column. */
export function usePostingFormScreenProps() {
  const { contentMaxWidth } = useResponsiveLayout();
  const isWeb = Platform.OS === 'web';

  return {
    atmosphere: 'none' as const,
    transparentBackground: isWeb,
    constrainFormWidth: true,
    formMaxWidth: isWeb ? contentMaxWidth ?? FORM_CONTENT_MAX_WIDTH : FORM_CONTENT_MAX_WIDTH,
    elevatedCard: isWeb,
  };
}
