import { Ionicons } from '@expo/vector-icons';

import { PillBadge } from '@/components/ui/PillBadge';
import { colorWithAlpha, useTheme, type GradientAccent } from '@/theme';

type FeaturedListingBadgeProps = {
  accent?: GradientAccent;
  /** Icon-only mark for dense table rows. */
  compact?: boolean;
};

/** Badge for Pro clinic priority placement in posting cards. */
export function FeaturedListingBadge({
  accent = 'primary',
  compact = false,
}: FeaturedListingBadgeProps) {
  const { colors, isDark } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;

  return (
    <PillBadge
      label={compact ? '' : 'Featured'}
      color={brandColor}
      backgroundColor={colorWithAlpha(brandColor, isDark ? 0.22 : 0.12)}
      borderColor={colorWithAlpha(brandColor, isDark ? 0.38 : 0.24)}
      accessibilityLabel="Featured listing"
      size={compact ? 'xs' : 'md'}
      style={{ alignSelf: 'center' }}
      leading={<Ionicons name="diamond-outline" size={compact ? 12 : 14} color={brandColor} />}
    />
  );
}
