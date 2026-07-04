import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { getHeroBandGradient, useTheme } from '@/theme';

/** Soft brand wash for auth screens (sign-in, sign-up). */
export function AuthHeroGlow() {
  const { colors, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const glowHeight = Math.min(height * 0.45, 380);

  return (
    <LinearGradient
      colors={getHeroBandGradient(colors, isDark, 'primary')}
      locations={[0, 0.35, 0.65, 0.85, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.glow, { height: glowHeight }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
