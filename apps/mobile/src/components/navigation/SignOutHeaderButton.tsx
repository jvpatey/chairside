import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable } from 'react-native';

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
    },
    buttonPressed: {
      backgroundColor: colors.separator,
      opacity: 0.9,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
  }));

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
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
