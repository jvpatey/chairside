import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveAccentColor, resolveAccentSubtle } from '@/lib/accentColors';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  fontRegular,
  fontSemibold,
  useTheme,
  useThemedStyles,
} from '@/theme';
import { webListRowHoverStyles, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';

export type DashboardQuickActionVariant = 'primary' | 'secondary';

type DashboardQuickActionTileProps = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant?: DashboardQuickActionVariant;
  compact?: boolean;
  disabled?: boolean;
  dimmed?: boolean;
  accessibilityHint?: string;
  /** Stacked phone tile even when the window is tablet-sized (marketing preview). */
  forcePhoneLayout?: boolean;
  onPress: () => void;
};

export function DashboardQuickActionTile({
  label,
  description,
  icon,
  variant = 'primary',
  compact = false,
  disabled = false,
  dimmed = false,
  accessibilityHint,
  forcePhoneLayout = false,
  onPress,
}: DashboardQuickActionTileProps) {
  const { colors } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const useStackedLayout = forcePhoneLayout || !isTablet;
  const isVisuallyMuted = disabled || dimmed;
  const accent = variant === 'primary' ? 'primary' : 'secondary';
  const accentColor = resolveAccentColor(colors, accent);
  const accentSubtle = resolveAccentSubtle(colors, accent);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    tile: {
      flex: 1,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: compact ? spacing.sm + 2 : spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      minHeight: compact ? 72 : useStackedLayout ? 84 : isTablet ? 96 : 88,
      justifyContent: 'center',
      ...webPointer(),
      ...webOnlyStyle({
        transitionProperty: 'background-color, opacity',
        transitionDuration: '140ms',
      } as const),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
    },
    stacked: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    stackedTextBlock: {
      alignItems: 'center',
      gap: 2,
      minWidth: 0,
    },
    tileHovered: webListRowHoverStyles(colors),
    tilePressed: {
      opacity: 0.88,
    },
    tileDisabled: {
      opacity: 0.52,
    },
    label: {
      fontSize: useStackedLayout ? 14 : 15,
      lineHeight: useStackedLayout ? 18 : 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
      letterSpacing: -0.2,
      textAlign: useStackedLayout ? ('center' as const) : ('left' as const),
    },
    description: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontRegular,
      color: colors.labelTertiary,
      textAlign: useStackedLayout ? ('center' as const) : ('left' as const),
    },
    chevron: {
      flexShrink: 0,
      opacity: 0.45,
    },
  }));

  const handlePress = () => {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isWeb = Platform.OS === 'web';
  const resolvedAccessibilityHint =
    accessibilityHint ??
    (isVisuallyMuted
      ? 'Posting limit reached. Remove an active ad or upgrade your plan.'
      : 'Opens this section of the app');

  const iconBadge = (
    <View style={[styles.iconBadge, { backgroundColor: accentSubtle }]}>
      <Ionicons name={icon} size={18} color={accentColor} />
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${description}`}
      accessibilityHint={resolvedAccessibilityHint}
      accessibilityState={{ disabled: isVisuallyMuted }}
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.tile,
        isVisuallyMuted && styles.tileDisabled,
        isWeb && hovered && !pressed && !disabled && styles.tileHovered,
        pressed && !disabled && styles.tilePressed,
      ]}>
      {useStackedLayout ? (
        <View style={styles.stacked}>
          {iconBadge}
          <View style={styles.stackedTextBlock}>
            <Text style={styles.label} numberOfLines={2}>
              {label}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          {iconBadge}
          <View style={styles.textBlock}>
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
            <Text style={styles.description} numberOfLines={1}>
              {description}
            </Text>
          </View>
          {Platform.OS !== 'web' ? (
            <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} style={styles.chevron} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}
