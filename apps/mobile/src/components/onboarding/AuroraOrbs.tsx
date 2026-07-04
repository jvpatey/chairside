import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colorWithAlpha, useTheme } from '@/theme';

type AuroraOrbsProps = {
  /** Height of the glow region; positions the secondary orb. */
  glowHeight: number;
  /** Scales orb opacity — auth/form screens use a calmer value (< 1). */
  intensity?: number;
};

/** Pair of slow-drifting brand-color orbs shared by onboarding glow backdrops. */
export function AuroraOrbs({ glowHeight, intensity = 1 }: AuroraOrbsProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const orbSizePrimary = Math.min(width * 0.72, 300);
  const orbSizeSecondary = Math.min(width * 0.58, 240);

  const primaryAlpha = (isDark ? 0.28 : 0.22) * intensity;
  const secondaryAlpha = (isDark ? 0.24 : 0.18) * intensity;
  const primaryBaseOpacity = isDark ? 0.52 : 0.42;
  const secondaryBaseOpacity = isDark ? 0.46 : 0.36;

  const driftPrimary = useSharedValue(0);
  const driftSecondary = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;

    driftPrimary.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    driftSecondary.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [driftPrimary, driftSecondary, reducedMotion]);

  const primaryOrbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -width * 0.18 + driftPrimary.value * 44 },
      { translateY: -28 + driftPrimary.value * 32 },
      { scale: 1 + driftPrimary.value * 0.1 },
    ],
    opacity: primaryBaseOpacity + driftPrimary.value * 0.16,
  }));

  const secondaryOrbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: width * 0.08 - driftSecondary.value * 38 },
      { translateY: glowHeight * 0.22 + driftSecondary.value * 28 },
      { scale: 0.9 + driftSecondary.value * 0.08 },
    ],
    opacity: secondaryBaseOpacity + driftSecondary.value * 0.14,
  }));

  return (
    <>
      <Animated.View
        style={[
          styles.orb,
          {
            width: orbSizePrimary,
            height: orbSizePrimary,
            borderRadius: orbSizePrimary / 2,
            backgroundColor: colorWithAlpha(colors.primary, primaryAlpha),
            top: -orbSizePrimary * 0.28,
            left: -orbSizePrimary * 0.22,
          },
          primaryOrbStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: orbSizeSecondary,
            height: orbSizeSecondary,
            borderRadius: orbSizeSecondary / 2,
            backgroundColor: colorWithAlpha(colors.secondary, secondaryAlpha),
            right: -orbSizeSecondary * 0.18,
          },
          secondaryOrbStyle,
        ]}
        pointerEvents="none"
      />
    </>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
  },
});
