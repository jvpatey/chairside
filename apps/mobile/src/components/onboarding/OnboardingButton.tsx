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
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 50,
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
      ...typography.body,
      fontWeight: '600' as const,
      color: colors.primaryOnPrimary,
    },
    labelPrimaryDisabled: {
      color: colors.labelTertiary,
    },
    labelSecondary: {
      ...typography.body,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    labelGhost: {
      ...typography.body,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    labelDestructive: {
      ...typography.body,
      fontWeight: '600' as const,
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
        style={
          variant === 'ghost'
            ? styles.labelGhost
            : variant === 'destructive'
              ? styles.labelDestructive
              : isPrimary
                ? [styles.labelPrimary, disabled && styles.labelPrimaryDisabled]
                : styles.labelSecondary
        }
        numberOfLines={2}
        textAlign="center">
        {label}
      </Text>
    </Pressable>
  );
}
