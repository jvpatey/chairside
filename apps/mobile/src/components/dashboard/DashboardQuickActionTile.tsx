import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { dashboardControlRadii } from '@/components/dashboard/dashboardLayout';
import {
  colorWithAlpha,
  getPrimaryTileGradient,
  getSecondaryTileGradient,
  fontBold,
  fontRegular,
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
  onPress: () => void;
};

export function DashboardQuickActionTile({
  label,
  description,
  icon,
  variant = 'primary',
  onPress,
}: DashboardQuickActionTileProps) {
  const { colors, isDark } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const isPrimary = variant === 'primary';
  const showDescription = isTablet;
  const gradientColors = isPrimary
    ? getPrimaryTileGradient(colors, isDark)
    : getSecondaryTileGradient(colors, isDark);

  const styles = useThemedStyles(({ colors, spacing, elevation, isDark }) => ({
    tile: {
      flex: 1,
      borderRadius: dashboardControlRadii.quickAction,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isPrimary
        ? colorWithAlpha(colors.primary, isDark ? 0.4 : 0.34)
        : colorWithAlpha(colors.secondary, isDark ? 0.27 : 0.3),
      ...elevation('subtle'),
      ...webPointer(),
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    row: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    tileHovered: webTileHoverStyles(colors, isDark),
    tilePressed: {
      opacity: 0.88,
      transform: [{ scale: 0.985 }],
    },
    iconHalo: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderWidth: StyleSheet.hairlineWidth,
    },
    iconHaloPrimary: {
      backgroundColor: colorWithAlpha(colors.primary, isDark ? 0.22 : 0.18),
      borderColor: colorWithAlpha(colors.primary, isDark ? 0.28 : 0.26),
    },
    iconHaloSecondary: {
      backgroundColor: colorWithAlpha(colors.secondary, isDark ? 0.22 : 0.18),
      borderColor: colorWithAlpha(colors.secondary, isDark ? 0.28 : 0.26),
    },
    label: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontBold,
      fontWeight: '600',
      color: colors.labelPrimary,
      letterSpacing: -0.2,
    },
    description: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontRegular,
      color: colors.labelSecondary,
    },
    chevron: {
      flexShrink: 0,
      opacity: 0.35,
      marginLeft: -spacing.xs,
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
        { minHeight: showDescription ? 92 : 82 },
        isWeb && hovered && !pressed && styles.tileHovered,
        pressed && styles.tilePressed,
      ]}>
      <LinearGradient colors={gradientColors} style={styles.gradient} />
      <View style={styles.row}>
        <View style={[styles.iconHalo, isPrimary ? styles.iconHaloPrimary : styles.iconHaloSecondary]}>
          <Ionicons
            name={icon}
            size={20}
            color={isPrimary ? colors.primary : colors.secondary}
          />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
          {showDescription ? (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>
        {isTablet ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.labelTertiary}
            style={styles.chevron}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
