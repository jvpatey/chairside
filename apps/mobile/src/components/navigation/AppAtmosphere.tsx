import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { getAtmosphereGradient, useTheme, type GradientAccent } from '@/theme';
import type { TabAtmosphereIntensity } from '@/lib/tabAtmosphereRoutes';

type AppAtmosphereProps = {
  intensity?: Exclude<TabAtmosphereIntensity, 'none'>;
  accent?: GradientAccent;
};

/** Soft brand wash fixed to the top of tab and hero surfaces. */
export function AppAtmosphere({ intensity = 'prominent', accent = 'primary' }: AppAtmosphereProps) {
  const { colors, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const glowHeight =
    intensity === 'prominent'
      ? Math.min(height * 0.48, 420)
      : Math.min(height * 0.34, 300);

  return (
    <LinearGradient
      colors={getAtmosphereGradient(colors, isDark, intensity, accent)}
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
    zIndex: 0,
  },
});
