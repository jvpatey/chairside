import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useShimmerTranslate } from '@/lib/motion';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

type ShimmerBlockProps = {
  height: number;
  width: number | `${number}%`;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Skeleton block with a sweeping shimmer highlight. */
export function ShimmerBlock({ height, width, borderRadius = 8, style }: ShimmerBlockProps) {
  const { colors, isDark } = useTheme();
  const translateX = useShimmerTranslate(typeof width === 'number' ? width : 280);

  const styles = useThemedStyles(({ colors }) => ({
    block: {
      height,
      width,
      borderRadius,
      backgroundColor: colors.fillSubtle,
      overflow: 'hidden',
    },
    shimmer: {
      ...StyleSheet.absoluteFillObject,
      width: '50%',
    },
  }));

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      return <View style={[styles.block, style]} />;
    }
  }

  return (
    <View style={[styles.block, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}>
        <LinearGradient
          colors={[
            'transparent',
            colorWithAlpha(colors.surface, isDark ? 0.35 : 0.55),
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}
