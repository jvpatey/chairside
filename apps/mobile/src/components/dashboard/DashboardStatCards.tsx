import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { useCountUp } from '@/hooks/useCountUp';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  colorWithAlpha,
  fontBold,
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
  icon: keyof typeof Ionicons.glyphMap;
  accent?: GradientAccent;
};

type DashboardStatCardsProps<T extends string = string> = {
  stats: DashboardStatCardItem<T>[];
  selected: T;
  onSelect: (key: T) => void;
};

function StatCardValue({ value, selected }: { value: number; selected: boolean }) {
  const animated = useCountUp(value, { durationMs: 680, enabled: selected });
  const display = selected ? animated : value;

  const styles = useThemedStyles(({ colors }) => ({
    value: {
      fontSize: 28,
      lineHeight: 32,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.8,
    },
  }));

  return <Text style={styles.value}>{display}</Text>;
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
      gap: spacing.sm,
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
      minHeight: isTablet ? 112 : 104,
      ...elevation('subtle'),
      ...webPointer(),
      ...(isWeb ? { width: 0 } : null),
    },
    cardSelected: {
      borderColor: colorWithAlpha(colors.primary, isDark ? 0.42 : 0.28),
      ...elevation('raised'),
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    inner: {
      flex: 1,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.sm + 4,
      gap: spacing.xs,
      justifyContent: 'space-between',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
    },
    label: {
      fontSize: 11.5,
      lineHeight: 14,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
      textAlign: 'left',
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
        const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
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
              <View style={styles.topRow}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: colorWithAlpha(brandColor, isDark ? 0.2 : 0.12),
                      borderColor: colorWithAlpha(brandColor, isDark ? 0.28 : 0.18),
                    },
                  ]}>
                  <Ionicons
                    name={stat.icon}
                    size={18}
                    color={isSelected ? brandColor : colors.labelSecondary}
                  />
                </View>
                {badgeCount > 0 ? <NotificationCountBadge count={badgeCount} /> : null}
              </View>
              <StatCardValue value={stat.value} selected={isSelected} />
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
