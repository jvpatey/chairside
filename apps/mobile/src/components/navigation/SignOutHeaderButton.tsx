import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable } from 'react-native';

import { useSignOut } from '@/hooks/useSignOut';
import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type SignOutHeaderButtonProps = {
  /** Transparent surface when nested inside a hero glass control */
  embedded?: boolean;
  size?: number;
};

export function SignOutHeaderButton({ embedded = false, size = 40 }: SignOutHeaderButtonProps) {
  const { colors } = useTheme();
  const { isSigningOut, signOut } = useSignOut();
  const iconSize = Math.round(size * 0.55);

  const styles = useThemedStyles(({ colors }) => ({
    button: {
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: embedded ? 'transparent' : colors.fillSubtle,
      ...webPointer(isSigningOut ? 'default' : 'pointer'),
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
        <Ionicons name="log-out-outline" size={iconSize} color={colors.labelPrimary} />
      )}
    </Pressable>
  );
}
