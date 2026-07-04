import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  colorWithAlpha,
  fontExtraBold,
  fontRegular,
  fontSemibold,
  getStatCardIdleGradient,
  getStatCardSelectedGradient,
  useTheme,
  useThemedStyles,
  type GradientAccent,
} from '@/theme';
import { webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';

export type DashboardStatCardItem<T extends string = string> = {
  key: T;
  label: string;
  value: number;
  badgeCount?: number;
  accent?: GradientAccent;
};

type DashboardStatCardsProps<T extends string = string> = {
  stats: DashboardStatCardItem<T>[];
  selected: T;
  onSelect: (key: T) => void;
};

function StatCardValue({ value }: { value: number }) {
  const styles = useThemedStyles(({ colors }) => ({
    value: {
      fontSize: 28,
      lineHeight: 32,
      fontFamily: fontExtraBold,
      fontWeight: '800',
      color: colors.labelPrimary,
      letterSpacing: -0.8,
      textAlign: 'center' as const,
      fontVariant: ['tabular-nums'] as const,
    },
  }));

  return <Text style={styles.value}>{value}</Text>;
}

export function DashboardStatCards<T extends string = string>({
  stats,
  selected,
  onSelect,
}: DashboardStatCardsProps<T>) {
  const { colors, isDark } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const isWeb = Platform.OS === 'web';

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
      borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: colors.separator,
      minHeight: isTablet ? 96 : 88,
      ...elevation('subtle'),
      ...webPointer(),
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
      gap: spacing.xs,
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
      {stats.map((stat) => {
        const isSelected = selected === stat.key;
        const accent = stat.accent ?? 'primary';
        const gradientColors = isSelected
          ? getStatCardSelectedGradient(colors, isDark, accent)
          : getStatCardIdleGradient(colors, isDark);
        const badgeCount = stat.badgeCount ?? 0;

        return (
          <Pressable
            key={stat.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${stat.label}: ${stat.value}${badgeCount > 0 ? `, ${badgeCount} updates` : ''}`}
            onPress={() => handleSelect(stat.key)}
            style={({ pressed, hovered }) => [
              styles.card,
              isSelected && styles.cardSelected,
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
              <StatCardValue value={stat.value} />
              <Text style={[styles.label, isSelected && styles.labelSelected]} numberOfLines={2}>
                {stat.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
