import { StyleSheet } from 'react-native';

import {
  colorWithAlpha,
  getFeaturedListingGradient,
  useTheme,
  useThemedStyles,
  type FeaturedListingGradient,
  type GradientAccent,
} from '@/theme';

export type { FeaturedListingGradient };

/** Featured cards use a left-to-right spotlight wash (strongest on the left edge). */
export function useFeaturedListingTreatment(accent: GradientAccent = 'primary') {
  const { colors, isDark } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;

  const styles = useThemedStyles(({ elevation, isDark }) => ({
    card: {
      overflow: 'hidden',
      position: 'relative',
      ...elevation('raised'),
      borderWidth: 1,
      borderColor: colorWithAlpha(brandColor, isDark ? 0.5 : 0.32),
      shadowColor: brandColor,
      shadowOpacity: isDark ? 0.32 : 0.14,
      shadowRadius: isDark ? 20 : 22,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    cardInner: {
      position: 'relative',
    },
    glow: {
      ...StyleSheet.absoluteFillObject,
    },
  }));

  const gradient = getFeaturedListingGradient(colors, isDark, accent);

  return { styles, brandColor, gradient };
}
