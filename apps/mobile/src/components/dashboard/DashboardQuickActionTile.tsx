import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { DashboardIconBadge } from '@/components/dashboard/DashboardIconBadge';
import { dashboardControlRadii } from '@/components/dashboard/dashboardLayout';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  colorWithAlpha,
  fontBold,
  fontRegular,
  fontSemibold,
  getPrimaryTileGradient,
  getSecondaryTileGradient,
  useTheme,
  useThemedStyles,
} from '@/theme';
import { webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';

export type DashboardQuickActionVariant = 'primary' | 'secondary';

type DashboardQuickActionTileProps = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant?: DashboardQuickActionVariant;
  compact?: boolean;
  onPress: () => void;
};

export function DashboardQuickActionTile({
  label,
  description,
  icon,
  variant = 'primary',
  compact = false,
  onPress,
}: DashboardQuickActionTileProps) {
  const { colors, isDark } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const isPrimary = variant === 'primary';
  const useStackedLayout = !isTablet;
  const gradientColors = isPrimary
    ? getPrimaryTileGradient(colors, isDark)
    : getSecondaryTileGradient(colors, isDark);
  const brandColor = isPrimary ? colors.primary : colors.secondary;

  const styles = useThemedStyles(({ colors, spacing, elevation, isDark }) => ({
    tile: {
      flex: 1,
      borderRadius: dashboardControlRadii.quickAction,
      paddingHorizontal: useStackedLayout ? spacing.sm + 2 : spacing.md,
      paddingVertical: useStackedLayout ? spacing.sm + 4 : spacing.md,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isPrimary
        ? colorWithAlpha(colors.primary, isDark ? 0.45 : 0.34)
        : colorWithAlpha(colors.secondary, isDark ? 0.32 : 0.3),
      minHeight: compact ? 72 : useStackedLayout ? 84 : isTablet ? 108 : 96,
      justifyContent: 'center',
      ...elevation('raised'),
      ...webPointer(),
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    row: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    stacked: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    tileHovered: webTileHoverStyles(colors, isDark),
    tilePressed: {
      opacity: 0.88,
      transform: [{ scale: 0.982 }],
    },
    iconHalo: {
      flexShrink: 0,
    },
    label: {
      fontSize: useStackedLayout ? 14 : 16,
      lineHeight: useStackedLayout ? 18 : 22,
      fontFamily: useStackedLayout ? fontSemibold : fontBold,
      fontWeight: useStackedLayout ? '600' : '700',
      color: colors.labelPrimary,
      letterSpacing: -0.2,
      textAlign: useStackedLayout ? ('center' as const) : ('left' as const),
    },
    description: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontRegular,
      color: colors.labelSecondary,
    },
    chevron: {
      flexShrink: 0,
      opacity: 0.45,
    },
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${description}`}
      accessibilityHint="Opens this section of the app"
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.tile,
        isWeb && hovered && !pressed && styles.tileHovered,
        pressed && styles.tilePressed,
      ]}>
      <LinearGradient colors={gradientColors} style={styles.gradient} />
      {useStackedLayout ? (
        <View style={styles.stacked}>
          <View style={styles.iconHalo}>
            <DashboardIconBadge
              icon={icon}
              accent={isPrimary ? 'primary' : 'secondary'}
              size="sm"
            />
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.iconHalo}>
            <DashboardIconBadge
              icon={icon}
              accent={isPrimary ? 'primary' : 'secondary'}
              size="md"
            />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} style={styles.chevron} />
        </View>
      )}
    </Pressable>
  );
}
