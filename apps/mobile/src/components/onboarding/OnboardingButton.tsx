import { Platform, Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type OnboardingButtonProps = {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function OnboardingButton({
  label,
  variant = 'primary',
  disabled,
  onPress,
  style,
}: OnboardingButtonProps) {
  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
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
    primary: {
      backgroundColor: colors.primary,
    },
    primaryPressed: {
      backgroundColor: colors.primaryPressed,
    },
    primaryHovered: webOnlyStyle({
      backgroundColor: colors.primaryPressed,
      transform: [{ translateY: -1 }],
      boxShadow: isDark
        ? '0 6px 16px rgba(74, 154, 255, 0.28)'
        : '0 4px 12px rgba(26, 111, 212, 0.28)',
    } as ViewStyle),
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
    labelPrimary: {
      color: colors.primaryOnPrimary,
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
                styles.primary,
                isWeb && hovered && !pressed && styles.primaryHovered,
                pressed && styles.primaryPressed,
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
                ? [styles.labelPrimary, disabled && styles.labelPrimaryDisabled]
                : styles.labelSecondary,
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit={false}>
        {label}
      </Text>
    </Pressable>
  );
}
