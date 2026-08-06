import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { DeltaChip } from '@/components/ui/DeltaChip';
import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { useCountUp } from '@/hooks/useCountUp';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { resolveAccentColor } from '@/lib/accentColors';
import {
  colorWithAlpha,
  fontExtraBold,
  fontSemibold,
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
  /** Shown when value is zero instead of dimming the card. */
  zeroHint?: string;
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
      textAlign: 'left' as const,
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
      borderColor: colorWithAlpha(colors.labelPrimary, isDark ? 0.08 : 0.05),
      minHeight: isTablet ? 104 : 96,
      backgroundColor: colors.surface,
      ...elevation('subtle'),
      ...webPointer(),
      ...webCardLiftBase(),
      ...(isWeb ? { width: 0 } : null),
    },
    cardSelected: {
      backgroundColor: colors.primarySubtle,
      borderColor: colorWithAlpha(colors.primary, isDark ? 0.42 : 0.28),
      ...elevation('raised'),
    },
    accentRail: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
    },
    inner: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: 4,
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
      textAlign: 'left' as const,
    },
    labelSelected: {
      color: colors.labelPrimary,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: 2,
    },
    zeroHint: {
      fontSize: 10,
      lineHeight: 13,
      color: colors.labelSecondary,
      textAlign: 'left' as const,
    },
    cardHovered: webTileHoverStyles(colors, isDark),
    cardPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
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
        const accent = stat.accent ?? 'primary';
        const accentColor = resolveAccentColor(colors, accent);
        const selectedForeground = isSelected ? accentColor : undefined;
        const badgeCount = stat.badgeCount ?? 0;
        const weekDelta = stat.weekDelta;
        const showDelta = weekDelta != null && weekDelta !== 0;
        const showZeroHint = stat.value === 0 && stat.zeroHint;

        return (
          <Pressable
            key={stat.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${stat.label}: ${stat.value}${
              showDelta ? `, ${weekDelta > 0 ? 'up' : 'down'} ${Math.abs(weekDelta)} this week` : ''
            }${badgeCount > 0 ? `, ${badgeCount} updates` : ''}`}
            onPress={() => handleSelect(stat.key)}
            style={({ pressed, hovered }) => [
              styles.card,
              isSelected && styles.cardSelected,
              isWeb && hovered && !pressed && styles.cardHovered,
              pressed && styles.cardPressed,
            ]}>
            <View style={[styles.accentRail, { backgroundColor: accentColor }]} />
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
                numberOfLines={2}>
                {stat.label}
              </Text>
              {showDelta ? (
                <View style={styles.metaRow}>
                  <DeltaChip delta={weekDelta} />
                </View>
              ) : showZeroHint ? (
                <Text style={styles.zeroHint} numberOfLines={2}>
                  {stat.zeroHint}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
