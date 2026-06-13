import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';

import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import {
  fontBold,
  fontSemibold,
  getStatSelectedGradient,
  useTheme,
  useThemedStyles,
} from '@/theme';
import { webOnlyStyle, webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';

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
  const styles = useThemedStyles(({ colors, spacing, radii, elevation, isDark }) => ({
    grid: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cellWrap: {
      flex: 1,
      position: 'relative',
    },
    badgeAnchor: {
      position: 'absolute',
      top: -6,
      right: 0,
      zIndex: 1,
    },
    cell: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: 'transparent',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      minHeight: 84,
      overflow: 'hidden',
      ...elevation('subtle'),
      ...webPointer(),
    },
    cellUnselected: {
      borderColor: colors.separator,
      backgroundColor: isDark ? colors.surface : colors.surfaceElevated,
    },
    cellSelected: {
      borderColor: isDark ? `${colors.primary}88` : `${colors.primary}66`,
      ...elevation('raised'),
    },
    gradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    cellHovered: webTileHoverStyles(colors, isDark),
    cellSelectedHovered: webOnlyStyle({
      borderColor: colors.primary,
      boxShadow: isDark
        ? '0 4px 14px rgba(74, 154, 255, 0.18)'
        : '0 4px 14px rgba(26, 111, 212, 0.14)',
    } as ViewStyle),
    value: {
      fontSize: 28,
      lineHeight: 32,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.5,
    },
    valueSelected: {
      color: colors.primary,
    },
    label: {
      fontSize: 12,
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
      {stats.map((stat) => {
        const isSelected = selected === stat.key;
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
          </View>
        );
      })}
    </View>
  );
}
