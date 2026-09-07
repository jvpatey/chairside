import { Ionicons } from '@expo/vector-icons';

import { PillBadge } from '@/components/ui/PillBadge';
import { colorWithAlpha, useTheme, type GradientAccent } from '@/theme';

type FeaturedListingBadgeProps = {
  accent?: GradientAccent;
  /** Icon-only mark for dense table rows. */
  compact?: boolean;
  /** Smaller badge for browse/discover list cards. */
  size?: 'sm' | 'md';
};

/** Badge for Pro clinic priority placement in posting cards. */
export function FeaturedListingBadge({
  accent = 'primary',
  compact = false,
  size = 'md',
}: FeaturedListingBadgeProps) {
  const { colors, isDark } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const resolvedSize = compact ? 'xs' : size;

  return (
    <PillBadge
      label={compact ? '' : 'Featured'}
      color={brandColor}
      backgroundColor={colorWithAlpha(brandColor, isDark ? 0.16 : 0.1)}
      borderColor={colorWithAlpha(brandColor, isDark ? 0.28 : 0.18)}
      accessibilityLabel="Featured listing"
      size={resolvedSize}
      style={{ alignSelf: 'center' }}
      leading={
        <Ionicons
          name="diamond-outline"
          size={resolvedSize === 'md' ? 13 : 11}
          color={brandColor}
        />
      }
    />
  );
}
