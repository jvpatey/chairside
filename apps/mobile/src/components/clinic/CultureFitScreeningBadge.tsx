import { Ionicons } from '@expo/vector-icons';
import type { ViewStyle } from 'react-native';

import { PillBadge, type PillBadgeSize } from '@/components/ui/PillBadge';
import { useTheme } from '@/theme';

type CultureFitScreeningBadgeProps = {
  /** Shorter label for list cards */
  compact?: boolean;
  size?: PillBadgeSize;
  style?: ViewStyle;
};

export function CultureFitScreeningBadge({
  compact = false,
  style,
  size,
}: CultureFitScreeningBadgeProps) {
  const { colors } = useTheme();
  const label = compact ? 'Screening' : 'Screening questions';
  const badgeSize = size ?? (compact ? 'sm' : 'md');
  const iconSize = badgeSize === 'xs' ? 10 : badgeSize === 'sm' ? 12 : 13;

  return (
    <PillBadge
      label={label}
      color={colors.primary}
      backgroundColor={colors.primarySubtle}
      borderColor={`${colors.primary}33`}
      leading={<Ionicons name="clipboard-outline" size={iconSize} color={colors.primary} />}
      accessibilityLabel={label}
      size={badgeSize}
      style={style}
    />
  );
}
