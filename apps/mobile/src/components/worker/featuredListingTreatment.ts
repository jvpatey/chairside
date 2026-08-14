import { colorWithAlpha, useTheme, type GradientAccent } from '@/theme';

/**
 * Featured listings: left accent rail + Featured badge, plus a light surface tint
 * and accent border so paid posts read as elevated without a glow/gradient.
 */
export function useFeaturedListingTreatment(accent: GradientAccent = 'primary') {
  const { colors, isDark } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;

  const cardStyle = {
    backgroundColor: colorWithAlpha(brandColor, isDark ? 0.1 : 0.05),
    borderColor: colorWithAlpha(brandColor, isDark ? 0.34 : 0.18),
    borderWidth: 1,
  };

  return { railColor: brandColor, brandColor, cardStyle };
}
