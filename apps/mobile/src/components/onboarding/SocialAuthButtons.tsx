import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useThemedStyles } from '@/theme';

type SocialAuthButtonsProps = {
  disabled?: boolean;
  onApplePress?: () => void;
  onGooglePress?: () => void;
};

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
    appleButton: {
      width: '100%',
      height: 50,
    },
  }));

  const showApple = Platform.OS === 'ios' && onApplePress;

  if (!showApple && !onGooglePress) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {showApple ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={styles.appleButton}
          onPress={onApplePress}
        />
      ) : null}
      {onGooglePress ? (
        <OnboardingButton
          label="Continue with Google"
          variant="secondary"
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
