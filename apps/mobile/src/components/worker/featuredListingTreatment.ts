import { StyleSheet } from 'react-native';

import { colorWithAlpha, useTheme, type GradientAccent } from '@/theme';

/**
 * Featured listings: quiet elevation via soft tint, hairline brand border, and
 * a short accent rail — clear priority without glow or heavy chrome.
 */
export function useFeaturedListingTreatment(accent: GradientAccent = 'primary') {
  const { colors, isDark } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;

  const cardStyle = {
    backgroundColor: colorWithAlpha(brandColor, isDark ? 0.08 : 0.045),
    borderColor: colorWithAlpha(brandColor, isDark ? 0.28 : 0.16),
    borderWidth: StyleSheet.hairlineWidth,
  };

  return {
    railColor: brandColor,
    brandColor,
    cardStyle,
  };
}
