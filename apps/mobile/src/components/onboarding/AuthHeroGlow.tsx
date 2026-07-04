import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AuroraOrbs } from '@/components/onboarding/AuroraOrbs';
import { getHeroBandGradient, useTheme } from '@/theme';

/** Soft brand wash with gentle aurora drift for auth screens (sign-in, sign-up, role). */
export function AuthHeroGlow() {
  const { colors, isDark } = useTheme();
  const { height } = useWindowDimensions();
  const glowHeight = Math.min(height * 0.45, 380);

  return (
    <View
      style={[styles.root, { height: glowHeight }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <LinearGradient
        colors={getHeroBandGradient(colors, isDark, 'primary')}
        locations={[0, 0.35, 0.65, 0.85, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <AuroraOrbs glowHeight={glowHeight} intensity={0.65} />
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
