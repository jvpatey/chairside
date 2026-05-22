import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Platform, Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type SocialAuthButtonsProps = {
  disabled?: boolean;
  onApplePress?: () => void;
  onGooglePress?: () => void;
};

type SocialAuthButtonProps = {
  label: string;
  disabled?: boolean;
  onPress?: () => void;
  variant: 'apple' | 'google';
};

function SocialAuthButton({ label, disabled, onPress, variant }: SocialAuthButtonProps) {
  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    button: {
      borderRadius: 12,
      minHeight: 50,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: spacing.md,
      opacity: disabled ? 0.55 : 1,
    },
    apple: {
      backgroundColor: isDark ? colors.surface : '#000000',
      borderWidth: 1,
      borderColor: isDark ? colors.separator : '#000000',
    },
    applePressed: {
      backgroundColor: isDark ? colors.surfaceElevated : '#1C1C1E',
    },
    google: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    googlePressed: {
      backgroundColor: colors.backgroundGrouped,
    },
    content: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.sm,
    },
    label: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    appleLabel: {
      color: '#FFFFFF',
    },
    googleLabel: {
      color: colors.labelPrimary,
    },
  }));

  const isApple = variant === 'apple';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isApple
          ? [styles.apple, pressed && !disabled && styles.applePressed]
          : [styles.google, pressed && !disabled && styles.googlePressed],
      ]}>
      <View style={styles.content}>
        {isApple ? (
          <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
        ) : (
          <AntDesign name="google" size={20} color="#4285F4" />
        )}
        <Text style={[styles.label, isApple ? styles.appleLabel : styles.googleLabel]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function SocialAuthButtons({
  disabled,
  onApplePress,
  onGooglePress,
}: SocialAuthButtonsProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      gap: spacing.sm,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginVertical: spacing.sm,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.separator,
    },
    dividerText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelTertiary,
    },
  }));

  const showApple = Platform.OS === 'ios' && onApplePress;

  if (!showApple && !onGooglePress) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {showApple ? (
        <SocialAuthButton
          label="Continue with Apple"
          variant="apple"
          disabled={disabled}
          onPress={onApplePress}
        />
      ) : null}
      {onGooglePress ? (
        <SocialAuthButton
          label="Continue with Google"
          variant="google"
          disabled={disabled}
          onPress={onGooglePress}
        />
      ) : null}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
}
