import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { useCountUp } from '@/hooks/useCountUp';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  colorWithAlpha,
  fontExtraBold,
  fontSemibold,
  getStatCardIdleGradient,
  getStatCardSelectedGradient,
  useTheme,
  useThemedStyles,
  type GradientAccent,
} from '@/theme';
import { webCardLiftBase, webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';

export type DashboardStatCardItem<T extends string = string> = {
  key: T;
  label: string;
  value: number;
  badgeCount?: number;
  accent?: GradientAccent;
  /** Net change over the last 7 days (positive = up). */
  weekDelta?: number;
};

type DashboardStatCardsProps<T extends string = string> = {
  stats: DashboardStatCardItem<T>[];
  selected: T;
  onSelect: (key: T) => void;
};

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

function formatWeekDelta(delta: number): string {
  if (delta > 0) return `▲${delta} this week`;
  return `▼${Math.abs(delta)} this week`;
}

function StatCardValue({
  value,
  color,
  delayMs,
  animate,
}: {
  value: number;
  color?: string;
  delayMs: number;
  animate: boolean;
}) {
  const displayValue = useCountUp(value, {
    durationMs: 640,
    delayMs,
    enabled: animate,
  });

  const styles = useThemedStyles(({ colors }) => ({
    value: {
      fontSize: 28,
      lineHeight: 32,
      fontFamily: fontExtraBold,
      fontWeight: '800',
      color: color ?? colors.labelPrimary,
      letterSpacing: -0.8,
      textAlign: 'center' as const,
      fontVariant: ['tabular-nums'] as const,
    },
  }));

  return <Text style={styles.value}>{displayValue}</Text>;
}

export function DashboardStatCards<T extends string = string>({
  stats,
  selected,
  onSelect,
}: DashboardStatCardsProps<T>) {
  const { colors, isDark } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const isWeb = Platform.OS === 'web';
  const reduceMotion = usePrefersReducedMotion();

  const styles = useThemedStyles(({ colors, spacing, radii, elevation, isDark }) => ({
    row: {
      flexDirection: 'row',
      gap: spacing.md,
      width: '100%',
      alignSelf: 'stretch',
    },
    card: {
      flex: 1,
      flexBasis: 0,
      minWidth: 0,
      borderRadius: radii.lg,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      minHeight: isTablet ? 104 : 96,
      ...elevation('subtle'),
      ...webPointer(),
      ...webCardLiftBase(),
      ...(isWeb ? { width: 0 } : null),
    },
    cardSelected: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(colors.primary, isDark ? 0.42 : 0.28),
      ...elevation('raised'),
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    inner: {
      flex: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm + 4,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    badgeAnchor: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
    },
    label: {
      fontSize: 11.5,
      lineHeight: 14,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
      textAlign: 'center' as const,
    },
    labelSelected: {
      color: colors.labelPrimary,
    },
    delta: {
      fontSize: 10,
      lineHeight: 12,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
      textAlign: 'center' as const,
      marginTop: 1,
    },
    deltaUp: {
      color: colors.success,
    },
    deltaDown: {
      color: colors.destructive,
    },
    cardHovered: webTileHoverStyles(colors, isDark),
    cardPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    cardEmpty: {
      opacity: 0.68,
    },
  }));

  const handleSelect = (key: T) => {
    void Haptics.selectionAsync();
    onSelect(key);
  };

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {stats.map((stat, index) => {
        const isSelected = selected === stat.key;
        const isEmpty = stat.value === 0;
        const accent = stat.accent ?? 'primary';
        const accentColor = accent === 'secondary' ? colors.secondary : colors.primary;
        const selectedForeground = isSelected
          ? isDark
            ? colors.labelPrimary
            : accentColor
          : undefined;
        const gradientColors = isSelected
          ? getStatCardSelectedGradient(colors, isDark, accent)
          : getStatCardIdleGradient(colors, isDark);
        const badgeCount = stat.badgeCount ?? 0;
        const weekDelta = stat.weekDelta;
        const showDelta = weekDelta != null && weekDelta !== 0;

        return (
          <Pressable
            key={stat.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${stat.label}: ${stat.value}${
              showDelta ? `, ${formatWeekDelta(weekDelta)}` : ''
            }${badgeCount > 0 ? `, ${badgeCount} updates` : ''}`}
            onPress={() => handleSelect(stat.key)}
            style={({ pressed, hovered }) => [
              styles.card,
              isSelected && styles.cardSelected,
              isEmpty && !isSelected && styles.cardEmpty,
              isWeb && hovered && !pressed && styles.cardHovered,
              pressed && styles.cardPressed,
            ]}>
            <LinearGradient colors={gradientColors} style={styles.gradient} />
            <View style={styles.inner}>
              {badgeCount > 0 ? (
                <View style={styles.badgeAnchor}>
                  <NotificationCountBadge count={badgeCount} />
                </View>
              ) : null}
              <StatCardValue
                value={stat.value}
                color={selectedForeground}
                delayMs={index * 60}
                animate={!reduceMotion}
              />
              <Text
                style={[
                  styles.label,
                  isSelected && styles.labelSelected,
                  selectedForeground ? { color: selectedForeground } : null,
                ]}
                numberOfLines={2}
              >
                {stat.label}
              </Text>
              {showDelta ? (
                <Text
                  style={[
                    styles.delta,
                    weekDelta > 0 ? styles.deltaUp : null,
                    weekDelta < 0 ? styles.deltaDown : null,
                    selectedForeground && weekDelta === 0
                      ? { color: selectedForeground }
                      : null,
                  ]}
                  numberOfLines={1}
                >
                  {formatWeekDelta(weekDelta)}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
