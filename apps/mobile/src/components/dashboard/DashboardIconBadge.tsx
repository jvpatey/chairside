import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colorWithAlpha, useTheme, useThemedStyles, type GradientAccent } from '@/theme';

const SIZES = {
  sm: { wrap: 36, icon: 18 },
  md: { wrap: 40, icon: 20 },
} as const;

type DashboardIconBadgeProps = {
  icon: keyof typeof Ionicons.glyphMap;
  accent?: GradientAccent;
  size?: keyof typeof SIZES;
};

/** Consistent circular icon halo used across dashboard cards and tiles. */
export function DashboardIconBadge({ icon, accent = 'primary', size = 'md' }: DashboardIconBadgeProps) {
  const { colors, isDark } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const dimensions = SIZES[size];

  const styles = useThemedStyles(({ radii }) => ({
    wrap: {
      width: dimensions.wrap,
      height: dimensions.wrap,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colorWithAlpha(brandColor, isDark ? 0.2 : 0.12),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(brandColor, isDark ? 0.28 : 0.18),
      flexShrink: 0,
    },
  }));

  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={dimensions.icon} color={brandColor} />
    </View>
  );
}
