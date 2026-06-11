import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { useTheme } from '@/theme';

function colorWithAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Soft blue wash from the top of the welcome screen — no hard circular edges. */
export function WelcomeHeroGlow() {
  const { colors, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const glowHeight = Math.min(height * 0.52, 440);

  const strong = colorWithAlpha(colors.primary, isDark ? 0.22 : 0.14);
  const mid = colorWithAlpha(colors.primary, isDark ? 0.1 : 0.06);
  const soft = colorWithAlpha(colors.primary, isDark ? 0.04 : 0.025);

  return (
    <LinearGradient
      colors={[strong, mid, soft, 'transparent']}
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
