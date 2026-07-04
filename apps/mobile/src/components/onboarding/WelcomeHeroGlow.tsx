import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AuroraOrbs } from '@/components/onboarding/AuroraOrbs';
import { getAtmosphereGradient, useTheme } from '@/theme';

/** Layered brand wash with slow drifting aurora orbs behind the welcome hero. */
export function WelcomeHeroGlow() {
  const { colors, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const glowHeight = Math.min(height * 0.65, 520);

  return (
    <View
      style={[styles.root, { height: glowHeight }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <LinearGradient
        colors={getAtmosphereGradient(colors, isDark)}
        locations={[0, 0.32, 0.62, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <AuroraOrbs glowHeight={glowHeight} />
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
  },
});
