import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { getAtmosphereGradient, useTheme } from '@/theme';

/** Soft blue wash from the top of the welcome screen — no hard circular edges. */
export function WelcomeHeroGlow() {
  const { colors, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const glowHeight = Math.min(height * 0.52, 440);

  return (
    <LinearGradient
      colors={getAtmosphereGradient(colors, isDark)}
      locations={[0, 0.32, 0.62, 1]}
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
