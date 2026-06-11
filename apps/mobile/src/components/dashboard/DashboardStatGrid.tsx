import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';

import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { webOnlyStyle, webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

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
  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
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
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'transparent',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    cellSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    cellHovered: webTileHoverStyles(colors, isDark),
    cellSelectedHovered: webOnlyStyle({
      borderColor: colors.primary,
      boxShadow: isDark
        ? '0 4px 14px rgba(74, 154, 255, 0.18)'
        : '0 4px 14px rgba(26, 111, 212, 0.14)',
    } as ViewStyle),
    value: {
      ...typography.title,
      fontSize: 24,
      lineHeight: 28,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    valueSelected: {
      color: colors.primary,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.2,
      color: colors.labelSecondary,
      textAlign: 'center',
    },
    labelSelected: {
      color: colors.labelPrimary,
    },
  }));

  const isWeb = Platform.OS === 'web';

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
              onPress={() => onSelect(stat.key)}
              style={({ pressed, hovered }) => [
                styles.cell,
                isSelected && styles.cellSelected,
                isWeb &&
                  hovered &&
                  !pressed &&
                  (isSelected ? styles.cellSelectedHovered : styles.cellHovered),
                pressed && { opacity: 0.85 },
              ]}>
              <Text style={[styles.value, isSelected && styles.valueSelected]}>{stat.value}</Text>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{stat.label}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
