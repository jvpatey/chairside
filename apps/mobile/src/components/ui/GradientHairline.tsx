import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

export const GRADIENT_HAIRLINE_HEIGHT = Math.max(StyleSheet.hairlineWidth, 1);

type GradientHairlineProps = {
  /** Horizontal inset from the container edges. */
  inset?: number;
  style?: StyleProp<ViewStyle>;
};

export function GradientHairline({ inset = 0, style }: GradientHairlineProps) {
  const { colors, isDark } = useTheme();

  const styles = useThemedStyles(() => ({
    wrap: {
      alignSelf: 'stretch',
      marginHorizontal: inset,
      height: GRADIENT_HAIRLINE_HEIGHT,
    },
    gradient: {
      flex: 1,
      height: GRADIENT_HAIRLINE_HEIGHT,
    },
  }));

  const line = colors.separator;
  const peakAlpha = isDark ? 0.72 : 0.58;
  const shoulderAlpha = isDark ? 0.28 : 0.22;

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[
          colorWithAlpha(line, 0),
          colorWithAlpha(line, shoulderAlpha),
          colorWithAlpha(line, peakAlpha),
          colorWithAlpha(line, shoulderAlpha),
          colorWithAlpha(line, 0),
        ]}
        locations={[0, 0.08, 0.5, 0.92, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
    </View>
  );
}
