import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

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
    ghost: {
      backgroundColor: 'transparent',
      minHeight: 44,
      paddingVertical: spacing.sm,
    },
    destructive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.destructive,
    },
    destructivePressed: {
      backgroundColor: `${colors.destructive}14`,
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

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' &&
          (disabled ? styles.primaryDisabled : [styles.primary, pressed && styles.primaryPressed]),
        variant === 'secondary' && [styles.secondary, pressed && styles.secondaryPressed],
        variant === 'ghost' && styles.ghost,
        variant === 'destructive' &&
          [styles.destructive, pressed && styles.destructivePressed],
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
