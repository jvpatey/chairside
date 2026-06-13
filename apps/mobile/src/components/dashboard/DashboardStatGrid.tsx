import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { dashboardControlRadii } from '@/components/dashboard/dashboardLayout';
import {
  fontBold,
  fontSemibold,
  colorWithAlpha,
  getStatSelectedGradient,
  useTheme,
  useThemedStyles,
} from '@/theme';
import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';

export type DashboardOverviewStat = 'roles' | 'fill-ins' | 'applications';

export type DashboardStatItem<T extends string = DashboardOverviewStat> = {
  key: T;
  label: string;
  value: number;
  badgeCount?: number;
};

type DashboardStatGridProps<T extends string = DashboardOverviewStat> = {
  stats: DashboardStatItem<T>[];
  selected: T;
  onSelect: (stat: T) => void;
};

export function DashboardStatGrid<T extends string = DashboardOverviewStat>({
  stats,
  selected,
  onSelect,
}: DashboardStatGridProps<T>) {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, elevation, isDark }) => ({
    grid: {
      flexDirection: 'row',
      borderRadius: dashboardControlRadii.statBar,
      padding: 3,
      backgroundColor: isDark ? colorWithAlpha(colors.surfaceElevated, 0.68) : colors.fillSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden',
      ...elevation('none'),
    },
    cellWrap: {
      flex: 1,
      position: 'relative',
    },
    badgeAnchor: {
      position: 'absolute',
      top: 3,
      right: 8,
      zIndex: 1,
    },
    divider: {
      position: 'absolute',
      top: 14,
      right: 0,
      bottom: 14,
      width: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      opacity: isDark ? 0.7 : 0.55,
    },
    cell: {
      borderRadius: dashboardControlRadii.statSegment,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'transparent',
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      gap: 4,
      minHeight: 72,
      overflow: 'hidden',
      ...elevation('none'),
      ...webPointer(),
    },
    cellUnselected: {
      backgroundColor: 'transparent',
    },
    cellSelected: {
      borderColor: isDark ? `${colors.primary}77` : `${colors.primary}55`,
      backgroundColor: isDark ? colorWithAlpha(colors.primary, 0.16) : colors.surfaceElevated,
      ...elevation('none'),
    },
    gradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    cellHovered: webOnlyStyle({
      backgroundColor: isDark ? colorWithAlpha(colors.surfaceElevated, 0.7) : colors.surfaceElevated,
    } as ViewStyle),
    cellSelectedHovered: webOnlyStyle({
      borderColor: colors.primary,
    } as ViewStyle),
    value: {
      fontSize: 22,
      lineHeight: 26,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.5,
    },
    valueSelected: {
      color: colors.primary,
    },
    label: {
      fontSize: 10.5,
      lineHeight: 14,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
      textAlign: 'center',
    },
    labelSelected: {
      color: colors.labelPrimary,
    },
  }));

  const isWeb = Platform.OS === 'web';

  const handleSelect = (key: T) => {
    void Haptics.selectionAsync();
    onSelect(key);
  };

  return (
    <View style={styles.grid}>
      {stats.map((stat, index) => {
        const isSelected = selected === stat.key;
        const isNextSelected = selected === stats[index + 1]?.key;
        const badgeCount = stat.badgeCount ?? 0;

        return (
          <View key={stat.key} style={styles.cellWrap}>
            {badgeCount > 0 ? (
              <View style={styles.badgeAnchor}>
                <NotificationCountBadge count={badgeCount} />
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${stat.label}: ${stat.value}${
                badgeCount > 0 ? `, ${badgeCount} updates` : ''
              }`}
              onPress={() => handleSelect(stat.key)}
              style={({ pressed, hovered }) => [
                styles.cell,
                !isSelected && styles.cellUnselected,
                isSelected && styles.cellSelected,
                isWeb &&
                  hovered &&
                  !pressed &&
                  (isSelected ? styles.cellSelectedHovered : styles.cellHovered),
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}>
              {isSelected ? (
                <LinearGradient
                  colors={getStatSelectedGradient(colors, isDark)}
                  style={styles.gradient}
                />
              ) : null}
              <Text style={[styles.value, isSelected && styles.valueSelected]}>{stat.value}</Text>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{stat.label}</Text>
            </Pressable>
            {index < stats.length - 1 && !isSelected && !isNextSelected ? (
              <View style={styles.divider} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
