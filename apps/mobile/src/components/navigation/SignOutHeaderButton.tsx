import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable } from 'react-native';

import { useSignOut } from '@/hooks/useSignOut';
import { useTheme, useThemedStyles } from '@/theme';

export function SignOutHeaderButton() {
  const { colors } = useTheme();
  const { isSigningOut, signOut } = useSignOut();

  const styles = useThemedStyles(({ colors }) => ({
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      // @ts-expect-error — cursor is web-only
      cursor: isSigningOut ? 'default' : 'pointer',
      // @ts-expect-error — transitionDuration is web-only
      transitionDuration: '140ms',
    },
    buttonHovered: {
      backgroundColor: colors.separator,
    },
    buttonPressed: {
      backgroundColor: colors.separator,
      opacity: 0.9,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  }));

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.button,
        isWeb && hovered && !pressed && !isSigningOut && styles.buttonHovered,
        pressed && !isSigningOut && styles.buttonPressed,
        isSigningOut && styles.buttonDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={isSigningOut ? 'Signing out' : 'Sign out'}
      disabled={isSigningOut}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        void signOut();
      }}>
      {isSigningOut ? (
        <ActivityIndicator size="small" color={colors.labelPrimary} />
      ) : (
        <Ionicons name="log-out-outline" size={22} color={colors.labelPrimary} />
      )}
    </Pressable>
  );
}
