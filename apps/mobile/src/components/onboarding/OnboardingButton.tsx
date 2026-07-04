import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import {
  getPrimaryTileGradient,
  getSecondaryTileGradient,
  useTheme,
  useThemedStyles,
  type GradientAccent,
} from '@/theme';
import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';

const PRESS_SPRING = { damping: 15, stiffness: 400 } as const;

type OnboardingButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  disabled?: boolean;
  onPress?: () => void;
  /** Layout on the animated wrapper (e.g. flex: 1 in dialog rows). */
  style?: StyleProp<ViewStyle>;
  /** Visual styles on the pressable button surface (padding, minHeight). */
  buttonStyle?: StyleProp<ViewStyle>;
  accent?: GradientAccent;
  /** Use a flat brand fill instead of the primary tile gradient. */
  solid?: boolean;
};

export function OnboardingButton({
  label,
  variant = 'primary',
  disabled,
  onPress,
  style,
  buttonStyle,
  accent = 'primary',
  solid = false,
}: OnboardingButtonProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const brandBg = accent === 'secondary' ? colors.secondary : colors.primary;
  const brandPressed = accent === 'secondary' ? colors.secondaryPressed : colors.primaryPressed;
  const brandOn = accent === 'secondary' ? colors.secondaryOnSecondary : colors.primaryOnPrimary;
  const primaryGradient =
    accent === 'secondary'
      ? getSecondaryTileGradient(colors, isDark)
      : getPrimaryTileGradient(colors, isDark);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    outer: {
      alignSelf: 'stretch' as const,
    },
    base: {
      alignSelf: 'stretch',
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 48,
      overflow: 'hidden' as const,
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    webInteractive: webPointer(),
    webDisabled: webPointer('default'),
    label: {
      ...typography.body,
      fontWeight: '600' as const,
      fontSize: 15,
      lineHeight: 20,
      textAlign: 'center' as const,
    },
    primaryDisabled: {
      backgroundColor: colors.fillSubtle,
    },
    primaryPressed: {
      opacity: 0.9,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    secondaryPressed: {
      backgroundColor: colors.backgroundGrouped,
    },
    secondaryHovered: {
      backgroundColor: colors.backgroundGrouped,
      borderColor: colors.labelTertiary,
    },
    ghost: {
      backgroundColor: 'transparent',
      minHeight: 44,
      paddingVertical: spacing.sm,
    },
    ghostHovered: {
      backgroundColor: accent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle,
    },
    destructive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.destructive,
    },
    destructivePressed: {
      backgroundColor: `${colors.destructive}14`,
    },
    destructiveHovered: {
      backgroundColor: `${colors.destructive}0D`,
      borderColor: colors.destructive,
    },
    labelPrimaryDisabled: {
      color: colors.labelTertiary,
    },
    labelSecondary: {
      color: colors.labelPrimary,
    },
    labelGhost: {
      color: brandBg,
    },
    labelDestructive: {
      color: colors.destructive,
    },
  }));

  const isPrimary = variant === 'primary';
  const isWeb = Platform.OS === 'web';
  const primaryBg = { backgroundColor: brandBg };
  const primaryPressedStyle = { backgroundColor: brandPressed };
  const primaryHoveredStyle = webOnlyStyle({
    transform: [{ translateY: -1 }],
    boxShadow: isDark
      ? accent === 'secondary'
        ? '0 6px 16px rgba(88, 86, 214, 0.28)'
        : '0 6px 16px rgba(74, 154, 255, 0.28)'
      : accent === 'secondary'
        ? '0 4px 12px rgba(88, 86, 214, 0.28)'
        : '0 4px 12px rgba(26, 111, 212, 0.28)',
  } as ViewStyle);
  const labelPrimaryStyle = { color: brandOn };

  const handlePressIn = () => {
    if (disabled) return;

    scale.value = withSpring(0.97, PRESS_SPRING);

    if (isPrimary && Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, PRESS_SPRING);
  };

  return (
    <Animated.View style={[styles.outer, animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed, hovered }) => [
          styles.base,
          buttonStyle,
          isWeb && (disabled ? styles.webDisabled : styles.webInteractive),
          variant === 'primary' &&
            (disabled
              ? styles.primaryDisabled
              : [
                  primaryBg,
                  isWeb && hovered && !pressed && primaryHoveredStyle,
                  pressed && styles.primaryPressed,
                  pressed && primaryPressedStyle,
                ]),
          variant === 'secondary' && [
            styles.secondary,
            isWeb && hovered && !pressed && styles.secondaryHovered,
            pressed && styles.secondaryPressed,
          ],
          variant === 'ghost' && [
            styles.ghost,
            isWeb && hovered && !pressed && styles.ghostHovered,
          ],
          variant === 'destructive' && [
            styles.destructive,
            isWeb && hovered && !pressed && styles.destructiveHovered,
            pressed && styles.destructivePressed,
          ],
        ]}>
        {isPrimary && !disabled && !solid ? (
          <LinearGradient colors={primaryGradient} style={styles.gradient} />
        ) : null}
        <Text
          style={[
            styles.label,
            variant === 'ghost'
              ? styles.labelGhost
              : variant === 'destructive'
                ? styles.labelDestructive
                : isPrimary
                  ? [labelPrimaryStyle, disabled && styles.labelPrimaryDisabled]
                  : styles.labelSecondary,
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit={false}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
