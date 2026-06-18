import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { SlidingSegmentIndicator } from '@/components/ui/SlidingSegmentIndicator';
import { dashboardControlRadii } from '@/components/dashboard/dashboardLayout';
import { useSlidingSegmentIndicator } from '@/hooks/useSlidingSegmentIndicator';
import {
  fontBold,
  fontSemibold,
  colorWithAlpha,
  getStatSelectedGradient,
  useTheme,
  useThemedStyles,
  type GradientAccent,
} from '@/theme';
import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';

export type DashboardOverviewStat = 'roles' | 'fill-ins' | 'applications';

/** Purple accent when the dashboard overview pill is on Fill-ins. */
export function getDashboardOverviewAccent(
  selected: DashboardOverviewStat,
): GradientAccent {
  return selected === 'fill-ins' ? 'secondary' : 'primary';
}

export type DashboardStatItem<T extends string = DashboardOverviewStat> = {
  key: T;
  label: string;
  value: number;
  badgeCount?: number;
};

type DashboardStatGridVariant = 'stat' | 'label';
type DashboardStatGridDensity = 'default' | 'compact';

type DashboardStatGridProps<T extends string = DashboardOverviewStat> = {
  stats: DashboardStatItem<T>[];
  selected: T;
  onSelect: (stat: T) => void;
  /** `stat` shows count + label (dashboard). `label` shows label only (mode switches). */
  variant?: DashboardStatGridVariant;
  /** `compact` fits more segments (e.g. applicant pipeline filters). */
  density?: DashboardStatGridDensity;
  accent?: GradientAccent;
  accessibilityRole?: 'button' | 'tab';
};

export function DashboardStatGrid<T extends string = DashboardOverviewStat>({
  stats,
  selected,
  onSelect,
  variant = 'stat',
  density = 'default',
  accent = 'primary',
  accessibilityRole = 'button',
}: DashboardStatGridProps<T>) {
  const { colors, isDark } = useTheme();
  const isLabelOnly = variant === 'label';
  const isCompact = density === 'compact';
  const manySegments = stats.length >= 5;
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;

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
      top: isCompact ? 10 : 14,
      right: 0,
      bottom: isCompact ? 10 : 14,
      width: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      opacity: isDark ? 0.7 : 0.55,
    },
    cell: {
      borderRadius: dashboardControlRadii.statSegment,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'transparent',
      paddingVertical: isLabelOnly ? spacing.sm : spacing.sm + 2,
      paddingHorizontal: isCompact ? spacing.xs : spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      gap: isLabelOnly ? 0 : 4,
      minHeight: isLabelOnly
        ? isCompact
          ? 40
          : 44
        : manySegments
          ? 64
          : isCompact
            ? 56
            : 72,
      overflow: 'hidden',
      ...elevation('none'),
      ...webPointer(),
    },
    cellUnselected: {
      backgroundColor: 'transparent',
    },
    indicator: {
      position: 'absolute',
      top: 3,
      left: 0,
      borderRadius: dashboardControlRadii.statSegment,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
    },
    gradient: {
      flex: 1,
    },
    cellHovered: webOnlyStyle({
      backgroundColor: isDark ? colorWithAlpha(colors.surfaceElevated, 0.7) : colors.surfaceElevated,
    } as ViewStyle),
    value: {
      fontSize: isCompact ? 18 : manySegments ? 20 : 22,
      lineHeight: isCompact ? 22 : manySegments ? 24 : 26,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.5,
    },
    label: {
      fontSize: isLabelOnly ? 14 : manySegments ? 11 : isCompact ? 11 : 10.5,
      lineHeight: isLabelOnly ? 18 : manySegments ? 14 : isCompact ? 14 : 14,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
      textAlign: 'center',
    },
    labelSelectedPrimary: {
      color: colors.labelPrimary,
    },
  }));

  const indicatorAccentStyle = {
    borderColor: isDark ? `${brandColor}77` : `${brandColor}55`,
    backgroundColor: isDark ? colorWithAlpha(brandColor, 0.16) : colors.surfaceElevated,
  };
  const selectedTextColor = { color: brandColor };

  const isWeb = Platform.OS === 'web';
  const selectedIndex = stats.findIndex((stat) => stat.key === selected);
  const { animatedStyle: indicatorStyle, onSegmentLayout } = useSlidingSegmentIndicator(
    selectedIndex >= 0 ? selectedIndex : 0,
  );

  const handleSelect = (key: T) => {
    void Haptics.selectionAsync();
    onSelect(key);
  };

  return (
    <View style={styles.grid}>
      <SlidingSegmentIndicator
        animatedStyle={indicatorStyle}
        style={[styles.indicator, indicatorAccentStyle]}
      >
        <LinearGradient
          colors={getStatSelectedGradient(colors, isDark, accent)}
          style={styles.gradient}
        />
      </SlidingSegmentIndicator>
      {stats.map((stat, index) => {
        const isSelected = selected === stat.key;
        const isNextSelected = selected === stats[index + 1]?.key;
        const badgeCount = stat.badgeCount ?? 0;

        const accessibilityLabel = isLabelOnly
          ? stat.label
          : `${stat.label}: ${stat.value}${badgeCount > 0 ? `, ${badgeCount} updates` : ''}`;

        return (
          <View
            key={stat.key}
            style={styles.cellWrap}
            onLayout={(event) => {
              const { x, y, width, height } = event.nativeEvent.layout;
              onSegmentLayout(index, { x, y, width, height });
            }}>
            {badgeCount > 0 ? (
              <View style={styles.badgeAnchor}>
                <NotificationCountBadge count={badgeCount} />
              </View>
            ) : null}
            <Pressable
              accessibilityRole={accessibilityRole}
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={accessibilityLabel}
              onPress={() => handleSelect(stat.key)}
              style={({ pressed, hovered }) => [
                styles.cell,
                !isSelected && styles.cellUnselected,
                isWeb &&
                  hovered &&
                  !pressed &&
                  !isSelected &&
                  styles.cellHovered,
                pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
              ]}>
              {!isLabelOnly ? (
                <Text style={[styles.value, isSelected && selectedTextColor]}>{stat.value}</Text>
              ) : null}
              <Text
                style={[
                  styles.label,
                  isSelected && (isLabelOnly ? selectedTextColor : styles.labelSelectedPrimary),
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={isCompact && !manySegments}
                minimumFontScale={0.85}>
                {stat.label}
              </Text>
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
