import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AuroraOrbs } from '@/components/onboarding/AuroraOrbs';
import {
  FILL_IN_HERO_GRADIENT_LOCATIONS,
  getAtmosphereGradient,
  getFillInHeroGradient,
  getHeroBandGradient,
  useTheme,
  type GradientAccent,
} from '@/theme';

export type PageHeroGlowVariant = 'subtle' | 'form' | 'accent';

type PageHeroGlowProps = {
  /** Visual weight — subtle for settings/lists, form for setup, accent for creation flows. */
  variant?: PageHeroGlowVariant;
  accent?: GradientAccent;
  /** Drifting orbs — use sparingly on auth/welcome only; most pages should stay static. */
  motion?: boolean;
};

const VARIANT_CONFIG = {
  subtle: {
    heightRatio: 0.38,
    maxHeight: 320,
    orbIntensity: 0.45,
  },
  form: {
    heightRatio: 0.45,
    maxHeight: 380,
    orbIntensity: 0.65,
  },
  accent: {
    heightRatio: 0.48,
    maxHeight: 420,
    orbIntensity: 0.78,
  },
} as const;

/** Shared brand wash backdrop — static gradient by default; optional motion for hero auth. */
export function PageHeroGlow({
  variant = 'form',
  accent = 'primary',
  motion = false,
}: PageHeroGlowProps) {
  const { colors, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const config = VARIANT_CONFIG[variant];
  const glowHeight = Math.min(height * config.heightRatio, config.maxHeight);
  const isSecondaryFillIn = accent === 'secondary' && variant !== 'subtle';

  const gradientColors = variant === 'subtle'
    ? getAtmosphereGradient(colors, isDark, 'subtle', accent)
    : isSecondaryFillIn
      ? getFillInHeroGradient(colors, isDark)
      : getHeroBandGradient(colors, isDark, accent);

  const gradientLocations = variant === 'subtle'
    ? ([0, 0.32, 0.62, 1] as const)
    : isSecondaryFillIn
      ? FILL_IN_HERO_GRADIENT_LOCATIONS
      : ([0, 0.2, 0.45, 0.7, 0.88, 1] as const);

  const gradientStart = { x: 0.5, y: 0 };
  const gradientEnd = { x: 0.5, y: 1 };

  return (
    <View
      style={[styles.root, { height: glowHeight }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <LinearGradient
        colors={gradientColors as readonly [string, string, ...string[]]}
        locations={gradientLocations as readonly [number, number, ...number[]]}
        start={gradientStart}
        end={gradientEnd}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {motion ? <AuroraOrbs glowHeight={glowHeight} intensity={config.orbIntensity} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
});
