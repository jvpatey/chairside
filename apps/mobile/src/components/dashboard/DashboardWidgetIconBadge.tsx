import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { dashboardWidgetTokens } from '@/components/dashboard/dashboardTokens';
import { useTheme, useThemedStyles } from '@/theme';

export type DashboardWidgetAccent = 'primary' | 'secondary' | 'tertiary';

type DashboardWidgetIconBadgeProps = {
  icon: keyof typeof Ionicons.glyphMap;
  accent?: DashboardWidgetAccent;
};

function resolveAccent(colors: ReturnType<typeof useTheme>['colors'], accent: DashboardWidgetAccent) {
  switch (accent) {
    case 'secondary':
      return { backgroundColor: colors.secondarySubtle, iconColor: colors.secondary };
    case 'tertiary':
      return { backgroundColor: colors.tertiarySubtle, iconColor: colors.tertiary };
    default:
      return { backgroundColor: colors.primarySubtle, iconColor: colors.primary };
  }
}

/** Square icon badge shared by dashboard aside widget headers and inline previews. */
export function DashboardWidgetIconBadge({
  icon,
  accent = 'primary',
}: DashboardWidgetIconBadgeProps) {
  const { colors } = useTheme();
  const { backgroundColor, iconColor } = resolveAccent(colors, accent);
  const { size, borderRadius, iconSize } = dashboardWidgetTokens.iconBadge;

  const styles = useThemedStyles(() => ({
    badge: {
      width: size,
      height: size,
      borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor,
      flexShrink: 0,
    },
  }));

  return (
    <View style={styles.badge}>
      <Ionicons name={icon} size={iconSize} color={iconColor} />
    </View>
  );
}
