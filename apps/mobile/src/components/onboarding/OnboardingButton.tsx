import { Platform, Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type OnboardingButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accent?: GradientAccent;
};

export function OnboardingButton({
  label,
  variant = 'primary',
  disabled,
  onPress,
  style,
  accent = 'primary',
}: OnboardingButtonProps) {
  const { colors, isDark } = useTheme();
  const brandBg = accent === 'secondary' ? colors.secondary : colors.primary;
  const brandPressed = accent === 'secondary' ? colors.secondaryPressed : colors.primaryPressed;
  const brandOn = accent === 'secondary' ? colors.secondaryOnSecondary : colors.primaryOnPrimary;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    base: {
      alignSelf: 'stretch',
      borderRadius: 12,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 52,
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
      backgroundColor: colors.primarySubtle,
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
      color: colors.primary,
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
    backgroundColor: brandPressed,
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

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.base,
        isWeb && (disabled ? styles.webDisabled : styles.webInteractive),
        variant === 'primary' &&
          (disabled
            ? styles.primaryDisabled
            : [
                primaryBg,
                isWeb && hovered && !pressed && primaryHoveredStyle,
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
        style,
      ]}
    >
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
  );
}
